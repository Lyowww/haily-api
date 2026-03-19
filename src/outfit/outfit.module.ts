import { Module } from '@nestjs/common';
import { OutfitController } from './outfit.controller';
import { OutfitService } from './outfit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WeatherModule } from '../weather/weather.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, WeatherModule, AIModule],
  controllers: [OutfitController],
  providers: [OutfitService],
  exports: [OutfitService],
})
export class OutfitModule {}

