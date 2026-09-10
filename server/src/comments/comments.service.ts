import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogService } from '../blog/blog.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { Comment, CommentStatus } from './entities/comment.entity.js';

// What a Visitor sees — no email, no status, one level of replies.
export interface PublicComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  replies: PublicComment[];
}

// What the Admin sees on the Comments page — includes the private email
// and the parent Post for context.
export interface AdminComment {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: CommentStatus;
  parentId: string | null;
  postId: string;
  postTitle: string;
  postSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    private readonly blog: BlogService,
  ) {}

  // Approved comments for a published Post, nested one level. `authorEmail`
  // is never loaded here (`select: false` on the column).
  async listApprovedTree(slug: string): Promise<PublicComment[]> {
    const postId = await this.blog.findPublishedIdBySlug(slug);
    const rows = await this.comments.find({
      where: { postId, status: 'approved' },
      order: { createdAt: 'ASC' },
    });

    const roots = new Map<string, PublicComment>();
    for (const row of rows) {
      if (row.parentId === null) {
        roots.set(row.id, {
          id: row.id,
          authorName: row.authorName,
          body: row.body,
          createdAt: row.createdAt,
          replies: [],
        });
      }
    }
    for (const row of rows) {
      if (row.parentId === null) continue;
      const parent = roots.get(row.parentId);
      // Drop a reply whose parent isn't itself an approved root.
      if (!parent) continue;
      parent.replies.push({
        id: row.id,
        authorName: row.authorName,
        body: row.body,
        createdAt: row.createdAt,
        replies: [],
      });
    }
    return [...roots.values()];
  }

  async create(slug: string, dto: CreateCommentDto): Promise<{ id: string; status: 'pending' }> {
    const postId = await this.blog.findPublishedIdBySlug(slug);

    if (dto.parentId) {
      const parent = await this.comments.findOne({ where: { id: dto.parentId } });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parent.parentId !== null) {
        throw new BadRequestException('Replies can only be made to top-level comments');
      }
    }

    const saved = await this.comments.save(
      this.comments.create({
        authorName: dto.authorName,
        authorEmail: dto.authorEmail ?? null,
        body: dto.body,
        postId,
        parentId: dto.parentId ?? null,
        status: 'pending',
      }),
    );
    // Deliberately doesn't echo the body or email.
    return { id: saved.id, status: 'pending' };
  }

  async listForAdmin(status?: CommentStatus): Promise<AdminComment[]> {
    const qb = this.comments
      .createQueryBuilder('c')
      .addSelect('c.authorEmail')
      .innerJoin('c.post', 'p')
      .addSelect(['p.id', 'p.title', 'p.slug'])
      .orderBy('c.createdAt', 'DESC');
    if (status) qb.where('c.status = :status', { status });

    const rows = await qb.getMany();
    return rows.map((row) => this.toAdminShape(row));
  }

  async setStatus(id: string, status: CommentStatus): Promise<AdminComment> {
    const existing = await this.comments.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    await this.comments.update(id, { status });

    const reloaded = await this.comments
      .createQueryBuilder('c')
      .addSelect('c.authorEmail')
      .innerJoin('c.post', 'p')
      .addSelect(['p.id', 'p.title', 'p.slug'])
      .where('c.id = :id', { id })
      .getOne();
    // Reload always succeeds — the row existed a statement ago and delete is
    // a separate admin action — but guard for the type.
    if (!reloaded) throw new NotFoundException('Comment not found');
    return this.toAdminShape(reloaded);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.comments.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    // The self-referencing FK's `onDelete: 'CASCADE'` removes any replies.
    await this.comments.delete(id);
  }

  async pendingCount(): Promise<{ count: number }> {
    return { count: await this.comments.count({ where: { status: 'pending' } }) };
  }

  private toAdminShape(row: Comment): AdminComment {
    return {
      id: row.id,
      authorName: row.authorName,
      authorEmail: row.authorEmail,
      body: row.body,
      status: row.status,
      parentId: row.parentId,
      postId: row.post.id,
      postTitle: row.post.title,
      postSlug: row.post.slug,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
