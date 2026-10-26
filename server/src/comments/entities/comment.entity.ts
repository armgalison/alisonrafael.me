import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../blog/entities/post.entity.js';

// A Comment's moderation state. App-level union, not a DB enum — nothing
// else in this schema uses DB enums, and the set is stable enough that a
// plain varchar + @Index is the lighter choice.
export type CommentStatus = 'pending' | 'approved' | 'rejected';

// State of the async Jev offensive-check queue for a Comment (see
// CommentsService.processOffensiveCheckQueue). 'pending' means it's due for
// an attempt (immediately, on create, or after a backoff delay); 'done'
// means offensiveRate was set successfully; 'failed' means all retries were
// exhausted without a successful call.
export type OffensiveCheckStatus = 'pending' | 'done' | 'failed';

// The first relational entity in the schema (see ADR 0009): a real
// @ManyToOne to Post and a self-referencing @ManyToOne to a parent
// Comment, both `onDelete: 'CASCADE'` so deleting a Post takes its
// Comments with it and deleting a top-level Comment takes its replies.
// `authorEmail` is `select: false` so a public query can never leak it —
// the admin list endpoint re-selects it explicitly.
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  authorName: string;

  @Column({ type: 'varchar', length: 254, nullable: true, select: false })
  authorEmail: string | null;

  @Column({ type: 'text' })
  body: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: CommentStatus;

  // The Jev decision API's 0-1 "offensive" probability, filled in
  // asynchronously by the retry queue below (see
  // CommentsService.processOffensiveCheckQueue). Null until that queue
  // lands a successful call — comment creation never blocks on it.
  @Column({ type: 'float', nullable: true })
  offensiveRate: number | null;

  // Queue state for the async Jev check, retried up to
  // MAX_OFFENSIVE_CHECK_ATTEMPTS times (comments.service.ts) with backoff.
  @Index()
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  offensiveCheckStatus: OffensiveCheckStatus;

  @Column({ type: 'int', default: 0 })
  offensiveCheckAttempts: number;

  // When the queue sweep should next attempt this Comment. Set to "now" on
  // create so the next sweep tick picks it up immediately. Nullable so that
  // comments predating this column (backfilled to offensiveCheckStatus
  // 'pending' by that column's DB default, since it has no default of its
  // own) are treated as due immediately too, instead of being stuck with a
  // zero-date or failing the migration outright.
  @Column({ type: 'timestamp', nullable: true })
  offensiveCheckNextRunAt: Date | null;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Index()
  @Column()
  postId: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Comment | null;

  // No explicit type/length: TypeORM infers it from the relation's target
  // key so the FK column types match exactly (this TypeORM build also
  // rejects `length` on a property that backs a relation).
  @Column({ nullable: true })
  parentId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
