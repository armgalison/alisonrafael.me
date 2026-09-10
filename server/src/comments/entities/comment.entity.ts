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
