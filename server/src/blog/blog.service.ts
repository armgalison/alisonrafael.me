import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../comments/entities/comment.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { Post } from './entities/post.entity.js';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
  ) {}

  // Published posts, newest first, each with an approved-only `commentCount`.
  // A single grouped count query is merged in rather than an N+1 (this
  // TypeORM build has no `loadRelationCountAndMap`). `coverImageUrl` /
  // `viewCount` are plain columns and come back with the base find.
  async findPublished() {
    const posts = await this.posts.find({
      where: { published: true },
      order: { publishedAt: 'DESC' },
    });
    if (posts.length === 0) return posts;

    const rows = await this.comments
      .createQueryBuilder('c')
      .select('c.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('c.status = :status', { status: 'approved' })
      .andWhere('c.postId IN (:...ids)', { ids: posts.map((p) => p.id) })
      .groupBy('c.postId')
      .getRawMany<{ postId: string; count: string }>();

    const countByPostId = new Map(rows.map((r) => [r.postId, Number(r.count)]));
    for (const post of posts) post.commentCount = countByPostId.get(post.id) ?? 0;
    return posts;
  }

  async findPublishedBySlug(slug: string) {
    const post = await this.posts.findOne({ where: { slug, published: true } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  // Slim lookup for CommentsService — avoids loading the `longtext` content
  // on every comment call.
  async findPublishedIdBySlug(slug: string): Promise<string> {
    const post = await this.posts.findOne({
      where: { slug, published: true },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post.id;
  }

  // Atomic bump — no read-modify-write. Un-deduplicated by design (ADR 0010).
  async registerView(slug: string): Promise<void> {
    const result = await this.posts.increment({ slug, published: true }, 'viewCount', 1);
    if (!result.affected) throw new NotFoundException('Post not found');
  }

  // Admin-only — includes drafts.
  findAll() {
    return this.posts.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: CreatePostDto) {
    if (await this.posts.exists({ where: { slug: dto.slug } })) {
      throw new ConflictException('A post with this slug already exists');
    }
    const post = this.posts.create({
      ...dto,
      publishedAt: dto.published ? new Date() : null,
    });
    return this.posts.save(post);
  }

  async update(id: string, dto: UpdatePostDto) {
    const post = await this.findOne(id);

    if (dto.slug && dto.slug !== post.slug && (await this.posts.exists({ where: { slug: dto.slug } }))) {
      throw new ConflictException('A post with this slug already exists');
    }

    const wasPublished = post.published;
    Object.assign(post, dto);
    if (dto.published && !wasPublished) {
      post.publishedAt = new Date();
    } else if (dto.published === false) {
      post.publishedAt = null;
    }

    return this.posts.save(post);
  }

  async remove(id: string) {
    const post = await this.findOne(id);
    await this.posts.remove(post);
  }
}
