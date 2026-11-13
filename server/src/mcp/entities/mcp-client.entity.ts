import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

// One OAuth client registered through Dynamic Client Registration (a
// claude.ai connector, a Claude Code install). Registering grants nothing:
// access needs a Connected client (McpGrant), which needs the Admin's login.
@Entity('mcp_clients')
export class McpClient {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  clientId: string;

  // The registration as the SDK returns it, client_secret included — the
  // SDK's token endpoint compares the secret in plain text. A secret alone
  // unlocks nothing without a refresh token.
  @Column({ type: 'json' })
  info: OAuthClientInformationFull;

  @CreateDateColumn()
  createdAt: Date;
}
