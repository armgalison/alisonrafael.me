import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import type { Server, ServerOptions } from 'socket.io';

// @WebSocketGateway's own decorator config is static and runs before Nest's
// DI (and therefore ConfigService) is available, so the CORS_ORIGIN allow-
// list computed in main.ts can only reach Socket.IO through an adapter like
// this one, applied via app.useWebSocketAdapter(). Express's app.enableCors
// doesn't cover this — Socket.IO's CORS is separate machinery.
export class LiveCursorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly corsOrigins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigins },
    } as ServerOptions);
  }
}
