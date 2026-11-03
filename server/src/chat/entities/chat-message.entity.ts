import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatSession } from './chat-session.entity.js'


export type ChatRole = 'user' | 'assistant';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @Index()
  @Column()
  sessionId: string;

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role: ChatRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
