import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_config_versions')
export class ChatConfigVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  configId: string;

  @Column({ type: 'text' })
  systemPromptTemplate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changeReason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
