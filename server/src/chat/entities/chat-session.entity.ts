import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  firstMessageAt: Date;

  @UpdateDateColumn()
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // The Visitor who opened the session, as the Access Log records them
  // (ADR 0019). ip and userAgent are personal data: ChatService clears them
  // after PAGE_VIEW_RETENTION_DAYS, keeping only the coarse country/network.
  // Null on sessions opened before these columns existed.
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  country: string | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  asn: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  asnOrg: string | null;
}
