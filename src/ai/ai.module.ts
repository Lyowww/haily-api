import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { ConfigModule } from '../config';
import { UploadModule } from '../upload/upload.module';
import { CutoutModule } from '../cutout/cutout.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [ConfigModule, UploadModule, CutoutModule, BillingModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}





