import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { ConfigModule } from '../config';
import { UploadModule } from '../upload/upload.module';
import { CutoutModule } from '../cutout/cutout.module';

@Module({
  imports: [ConfigModule, UploadModule, CutoutModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}





