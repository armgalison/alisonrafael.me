import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { Post } from './entities/post.entity.js';

@Injectable()
export class BlogService {
  constructor(@InjectRepository(Post) private readonly posts: Repository<Post>) {}

  findPublished() {
    return this.posts.find({
      where: { published: true },
      order: { publishedAt: 'DESC' },
    });
  }

  async findPublishedBySlug(slug: string) {
    const post = await this.posts.findOne({ where: { slug, published: true } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
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
