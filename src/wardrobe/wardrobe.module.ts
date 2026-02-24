import { Module } from '@nestjs/common';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeService } from './wardrobe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CutoutModule } from '../cutout/cutout.module';

@Module({
  imports: [PrismaModule, CutoutModule],
  controllers: [WardrobeController],
  providers: [WardrobeService],
  exports: [WardrobeService],
})
export class WardrobeModule {}





