import { Module } from '@nestjs/common';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeService } from './wardrobe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CutoutService } from '../cutout/cutout.service';

@Module({
  imports: [PrismaModule],
  controllers: [WardrobeController],
  providers: [WardrobeService, CutoutService],
  exports: [WardrobeService],
})
export class WardrobeModule {}





