import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BlogService } from './blog.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

@Controller('posts')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  // --- Admin routes (registered before ':slug' so they aren't shadowed by it) ---

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  findAllForAdmin() {
    return this.blog.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.blog.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost('admin')
  create(@Body() dto: CreatePostDto) {
    return this.blog.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blog.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.blog.remove(id);
  }

  // --- Public routes ---

  @Get()
  findPublished() {
    return this.blog.findPublished();
  }

  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.blog.findPublishedBySlug(slug);
  }
}
