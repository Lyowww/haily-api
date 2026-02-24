import { Module } from '@nestjs/common';
import { CutoutService } from './cutout.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  providers: [CutoutService],
  exports: [CutoutService],
})
export class CutoutModule {}
