import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

// A single-use OAuth authorization code, issued after the Admin logs in on
// the consent page and exchanged (with its PKCE verifier) for a token pair.
@Entity('mcp_authorization_codes')
export class McpAuthorizationCode {
  // SHA-256 of the code; the code itself is never stored.
  @PrimaryColumn({ type: 'char', length: 64 })
  codeHash: string;

  @Column({ type: 'varchar', length: 64 })
  clientId: string;

  @Column({ type: 'varchar', length: 36 })
  adminId: string;

  @Column({ type: 'varchar', length: 128 })
  codeChallenge: string;

  @Column({ type: 'varchar', length: 2048 })
  redirectUri: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
