import { Module } from '@nestjs/common';
import { OutfitController } from './outfit.controller';
import { OutfitService } from './outfit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [PrismaModule, WeatherModule],
  controllers: [OutfitController],
  providers: [OutfitService],
  exports: [OutfitService],
})
export class OutfitModule {}

