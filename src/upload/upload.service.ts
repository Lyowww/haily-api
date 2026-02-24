import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config';
import { S3Service } from './s3.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getUploadsRoot, ensureUploadsDir } from '../utils/uploads-path';

export interface UploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface UploadBufferResult {
  url: string;
  key: string;
}

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(
    private configService: ConfigService,
    private s3Service: S3Service,
  ) {
    this.uploadDir = getUploadsRoot();
    ensureUploadsDir(this.uploadDir);
  }

  get isS3Enabled(): boolean {
    return this.s3Service.isEnabled;
  }

  /**
   * Upload a buffer to storage (S3 when configured, otherwise local disk).
   * Used by AI/cutout for generated images. Key is relative, e.g. "generated/outfit-1.png".
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string = 'image/png',
  ): Promise<UploadBufferResult> {
    const normalizedKey = key.replace(/^\//, '').replace(/^uploads\//, '') || key;
    const s3Key = normalizedKey.startsWith('uploads/') ? normalizedKey : `uploads/${normalizedKey}`;

    if (this.s3Service.isEnabled) {
      const url = await this.s3Service.putObject(s3Key, buffer, contentType);
      return { url, key: s3Key };
    }

    const localPath = path.join(this.uploadDir, normalizedKey);
    const dir = path.dirname(localPath);
    ensureUploadsDir(dir);
    fs.writeFileSync(localPath, buffer);
    const url = `/uploads/${normalizedKey}`;
    return { url, key: s3Key };
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Multer memoryStorage should always provide a buffer. If it is empty, the client
    // likely sent a broken multipart request (e.g. missing boundary / empty body).
    if (!file.buffer || file.buffer.length === 0 || file.size === 0) {
      throw new BadRequestException(
        'Uploaded file is empty (0 bytes). Please re-upload and ensure the client sends the file bytes correctly.',
      );
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Validate mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;

    if (this.s3Service.isEnabled) {
      const s3Key = `uploads/${uniqueFilename}`;
      const url = await this.s3Service.putObject(s3Key, file.buffer, file.mimetype);
      return {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.buffer.length,
        url,
        path: s3Key,
      };
    }

    const filePath = path.join(this.uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, file.buffer);
    const writtenSize = fs.statSync(filePath).size;
    if (writtenSize === 0) {
      throw new BadRequestException(
        'Uploaded file was saved as 0 bytes. This usually means the client sent an empty file payload.',
      );
    }

    const url = `/uploads/${uniqueFilename}`;

    return {
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: writtenSize,
      url,
      path: filePath,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    if (this.s3Service.isEnabled) {
      const key = filename.startsWith('uploads/') ? filename : `uploads/${filename}`;
      await this.s3Service.deleteObject(key);
      return;
    }

    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  getAllowedMimeTypes(): string[] {
    return this.allowedMimeTypes;
  }
}

