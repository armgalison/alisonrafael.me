import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOADS_DIR,
  UPLOADS_ROUTE,
} from './uploads.constants.js';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
          cb(new UnsupportedMediaTypeException('Only image uploads (jpeg, png, webp, gif) are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `${req.protocol}://${req.get('host')}${UPLOADS_ROUTE}/${file.filename}` };
  }
}
