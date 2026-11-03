import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat_config')
export class ChatConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  systemPromptTemplate: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Metadata
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
