import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';

// A Live Cursor is 1:1 with one connection's lifetime: created on connect,
// removed on disconnect, scoped to exactly one room for its entire life.
// See CONTEXT.md's "Live Cursor" entry and docs/adr/0017.
const ROOM_PATTERN = /^(home|blog|post:[a-z0-9-]+)$/;

const COLORS = [
  '#6ee7c2', // accent
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#fb923c', // orange
  '#34d399', // emerald
  '#f87171', // red
];

// Max cursor:move events accepted per connection per window — the rest are
// dropped, not queued. Same in-memory, fixed-window shape as
// server/src/comments/comment-rate-limit.guard.ts (ADR 0009), keyed by
// socket id instead of req.ip since this is a WS message handler, not an
// HTTP guard.
const MAX_MOVES_PER_WINDOW = 20;
const MOVE_WINDOW_MS = 1000;

interface CursorState {
  color: string;
  xPct: number;
  yPct: number;
}

function isValidPct(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

// Deliberately unauthenticated (no JwtAuthGuard, no AuthModule import) — a
// Live Cursor has no identity worth protecting. Every field is in-memory
// only, reset on restart, never persisted to MariaDB.
@WebSocketGateway({ namespace: '/live-cursors' })
export class LiveCursorsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly roomBySocket = new Map<string, string>();
  private readonly colorBySocket = new Map<string, string>();
  private readonly cursorsByRoom = new Map<string, Map<string, CursorState>>();
  private readonly moveHits = new Map<string, { count: number; windowStart: number }>();

  handleConnection(client: Socket): void {
    const room = client.handshake.query.room;
    if (typeof room !== 'string' || !ROOM_PATTERN.test(room)) {
      client.disconnect(true);
      return;
    }

    client.join(room);
    this.roomBySocket.set(client.id, room);
    this.colorBySocket.set(client.id, COLORS[Math.floor(Math.random() * COLORS.length)]);

    let cursors = this.cursorsByRoom.get(room);
    if (!cursors) {
      cursors = new Map();
      this.cursorsByRoom.set(room, cursors);
    }

    // A late joiner needs everyone else's frozen-in-place position up
    // front, not just future moves — this is what makes "arrow stays put
    // until disconnect" true regardless of join order.
    client.emit(
      'cursor:snapshot',
      Array.from(cursors.entries()).map(([id, state]) => ({ id, ...state })),
    );
  }

  @SubscribeMessage('cursor:move')
  handleMove(@ConnectedSocket() client: Socket, @MessageBody() body: unknown): void {
    const room = this.roomBySocket.get(client.id);
    if (!room || !this.allowedByThrottle(client.id)) return;

    const { xPct, yPct } = (body ?? {}) as { xPct?: unknown; yPct?: unknown };
    if (!isValidPct(xPct) || !isValidPct(yPct)) return;

    const color = this.colorBySocket.get(client.id);
    if (!color) return;

    const state: CursorState = { color, xPct, yPct };
    this.cursorsByRoom.get(room)?.set(client.id, state);
    client.to(room).emit('cursor:moved', { id: client.id, ...state });
  }

  handleDisconnect(client: Socket): void {
    const room = this.roomBySocket.get(client.id);
    this.roomBySocket.delete(client.id);
    this.colorBySocket.delete(client.id);
    this.moveHits.delete(client.id);

    if (room) {
      this.cursorsByRoom.get(room)?.delete(client.id);
      client.to(room).emit('cursor:left', { id: client.id });
    }
  }

  // Every entry is deleted explicitly on disconnect above, so — unlike
  // CommentRateLimitGuard's IP-keyed hourly window — the map's size is
  // always bounded by the current connection count and needs no separate
  // prune sweep.
  private allowedByThrottle(socketId: string): boolean {
    const now = Date.now();
    const entry = this.moveHits.get(socketId);

    if (!entry || now - entry.windowStart >= MOVE_WINDOW_MS) {
      this.moveHits.set(socketId, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= MAX_MOVES_PER_WINDOW) return false;

    entry.count += 1;
    return true;
  }
}
