import { Module } from '@nestjs/common';
import { LiveCursorsGateway } from './live-cursors.gateway.js';

// No imports — deliberately not coupled to AuthModule. See CONTEXT.md's
// "Live Cursor" entry and docs/adr/0017.
@Module({
  providers: [LiveCursorsGateway],
})
export class LiveCursorsModule {}
