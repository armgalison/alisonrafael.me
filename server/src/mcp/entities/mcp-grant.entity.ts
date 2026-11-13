import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// A Connected client (CONTEXT.md): one client the Admin allowed into the
// Admin MCP, with its current token pair. Tokens are opaque and stored only
// as SHA-256 hashes; refreshing replaces both, so the previous pair stops
// working at once. Deleting the row is revoking it (ADR 0021).
@Entity('mcp_grants')
export class McpGrant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  clientId: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 36 })
  adminId: string;

  @Index({ unique: true })
  @Column({ type: 'char', length: 64 })
  accessTokenHash: string;

  @Column({ type: 'datetime' })
  accessTokenExpiresAt: Date;

  @Index({ unique: true })
  @Column({ type: 'char', length: 64 })
  refreshTokenHash: string;

  @Column({ type: 'datetime' })
  refreshTokenExpiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastUsedAt: Date | null;
}
