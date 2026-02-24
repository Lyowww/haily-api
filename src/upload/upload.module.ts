import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';
import { ConfigModule } from '../config';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [S3Service, UploadService],
  exports: [UploadService, S3Service],
})
export class UploadModule {}





