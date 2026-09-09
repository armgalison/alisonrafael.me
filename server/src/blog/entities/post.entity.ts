import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column({ type: 'text' })
  excerpt: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
