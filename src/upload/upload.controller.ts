import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { memoryStorage } from 'multer';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, GIF) - Max 10MB',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      example: {
        filename: 'uuid-generated-filename.jpg',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 123456,
        url: '/uploads/uuid-generated-filename.jpg',
        path: '/absolute/path/to/uploads/uuid-generated-filename.jpg',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('Upload endpoint hit');
    console.log('File received:', file ? {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    } : 'NO FILE');

    if (!file) {
      console.error('No file in request');
      throw new BadRequestException('No file provided');
    }

    // When the client sets multipart headers incorrectly (common in React Native/Expo),
    // Multer may receive a "file" entry with 0 bytes.
    if (!file.buffer || file.buffer.length === 0 || file.size === 0) {
      throw new BadRequestException(
        'Uploaded file is empty (0 bytes). Ensure your client sends a real multipart/form-data file. If you use React Native/Expo, do NOT manually set the Content-Type header; let fetch/axios set the boundary.',
      );
    }

    return this.uploadService.uploadFile(file);
  }
}

