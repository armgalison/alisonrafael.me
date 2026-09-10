import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity.js';

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

  // Optional lead visual for the listing cards — a URL from POST /uploads
  // (see the Cover image definition in CONTEXT.md). Nullable so it can be
  // added to the already-populated table under `synchronize: true`.
  @Column({ type: 'varchar', length: 512, nullable: true })
  coverImageUrl: string | null;

  // Bumped once per reading-page load, un-deduplicated by design (ADR 0010).
  // NOT NULL but has a default, so the column backfills existing rows with 0.
  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date | null;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  // Not a column — populated only by BlogService.findPublished()'s query
  // (approved comments only). Absent on every other code path.
  commentCount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
