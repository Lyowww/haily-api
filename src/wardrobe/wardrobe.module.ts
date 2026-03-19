import { Module } from '@nestjs/common';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeService } from './wardrobe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, AIModule, UploadModule],
  controllers: [WardrobeController],
  providers: [WardrobeService],
  exports: [WardrobeService],
})
export class WardrobeModule {}





