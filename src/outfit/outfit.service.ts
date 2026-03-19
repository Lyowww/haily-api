import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather/weather.service';
import { AIService } from '../ai/ai.service';
import { GenerateOutfitDto, SaveOutfitDto } from './dto';

function getTargetDate(dateLabel: 'today' | 'tomorrow' = 'today'): Date {
  const date = new Date();
  if (dateLabel === 'tomorrow') {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

function getWeekStartDate(date: Date): Date {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = value.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setUTCDate(value.getUTCDate() + diff);
  return value;
}

@Injectable()
export class OutfitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly weatherService: WeatherService,
    private readonly aiService: AIService,
  ) {}

  private uniqueItemIds(itemIds: string[]): string[] {
    return Array.from(
      new Set(itemIds.filter((itemId) => typeof itemId === 'string' && itemId.length > 0)),
    );
  }

  private async getWeatherContext(userId: string, dateLabel: 'today' | 'tomorrow') {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
      select: { latitude: true, longitude: true, timezone: true },
    });

    const targetDate = getTargetDate(dateLabel);

    if (settings?.latitude == null || settings?.longitude == null) {
      return {
        date: targetDate.toISOString().slice(0, 10),
        temperatureC: 20,
        minTempC: 16,
        maxTempC: 22,
        condition: 'clear',
        source: 'fallback',
      };
    }

    if (dateLabel === 'today') {
      const weather = await this.weatherService.getTodaySummary({
        latitude: settings.latitude,
        longitude: settings.longitude,
        timezone: settings.timezone ?? 'auto',
      });

      return {
        date: weather.nowIso.slice(0, 10),
        temperatureC: weather.current.temperatureC,
        minTempC: weather.today.minTempC,
        maxTempC: weather.today.maxTempC,
        condition: weather.today.condition,
        source: 'open-meteo',
      };
    }

    const weekStart = getWeekStartDate(targetDate);
    const dayIndexMonday0 = (targetDate.getUTCDay() + 6) % 7;
    const forecast = await this.weatherService.getWeekForecast({
      latitude: settings.latitude,
      longitude: settings.longitude,
      timezone: settings.timezone ?? 'auto',
      weekStartDate: weekStart.toISOString().slice(0, 10),
    });
    const day = forecast[dayIndexMonday0];

    return {
      date: day?.date ?? targetDate.toISOString().slice(0, 10),
      temperatureC: Math.round(
        ((day?.minTempC ?? 16) + (day?.maxTempC ?? 22)) / 2,
      ),
      minTempC: day?.minTempC ?? 16,
      maxTempC: day?.maxTempC ?? 22,
      condition: day?.condition ?? 'clear',
      source: 'open-meteo',
    };
  }

  async generateOutfit(userId: string, dto: GenerateOutfitDto) {
    if (dto.userId && dto.userId !== userId) {
      throw new BadRequestException('userId must match the authenticated user');
    }

    const dateLabel = dto.date ?? 'today';

    const [user, wardrobeItems, event, weather] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, tasteProfile: true },
      }),
      this.prisma.wardrobeItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      dto.eventId
        ? this.prisma.userEvent.findFirst({
            where: { id: dto.eventId, userId },
          })
        : Promise.resolve(null),
      this.getWeatherContext(userId, dateLabel),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.eventId && !event) {
      throw new NotFoundException('Event not found');
    }

    if (!wardrobeItems.length) {
      throw new BadRequestException('Wardrobe is empty');
    }

    const recommendation = await this.aiService.generateStructuredOutfitRecommendation({
      wardrobeItems: wardrobeItems.map((item) => ({
        id: item.id,
        name: item.name,
        isFavorite: item.isFavorite,
        category: item.category,
        subcategory: item.subcategory,
        seasons: item.seasons,
        occasions: item.occasions,
        tags: item.tags,
        temperatureRange:
          item.temperatureRange && typeof item.temperatureRange === 'object'
            ? (item.temperatureRange as { minC?: number; maxC?: number })
            : null,
      })),
      tasteProfile:
        user.tasteProfile && typeof user.tasteProfile === 'object'
          ? (user.tasteProfile as Record<string, any>)
          : null,
      event: event
        ? {
            id: event.id,
            name: event.name,
            type: event.type,
            date: event.date.toISOString(),
          }
        : null,
      customEventText: dto.customEventText ?? null,
      weather,
      dateLabel,
      favoritesMode: dto.favoritesMode ?? 'neutral',
    });

    return {
      outfit_items: recommendation.outfitItemIds,
      explanation: recommendation.explanation,
      weather_match: recommendation.weatherMatch,
      style_match: recommendation.styleMatch,
    };
  }

  async saveOutfit(userId: string, dto: SaveOutfitDto) {
    const itemIds = this.uniqueItemIds(dto.itemIds);

    if (!itemIds.length) {
      throw new BadRequestException('itemIds must contain at least one wardrobe item');
    }

    const wardrobeItems = await this.prisma.wardrobeItem.findMany({
      where: {
        userId,
        id: { in: itemIds },
      },
      select: { id: true },
    });

    if (wardrobeItems.length !== itemIds.length) {
      throw new BadRequestException('One or more wardrobe items do not belong to the user');
    }

    if (dto.eventId) {
      const event = await this.prisma.userEvent.findFirst({
        where: { id: dto.eventId, userId },
        select: { id: true },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }
    }

    return this.prisma.outfit.create({
      data: {
        userId,
        name: dto.name ?? null,
        eventId: dto.eventId ?? null,
        items: itemIds,
        aiGenerated: dto.aiGenerated ?? false,
        explanation: dto.explanation ?? null,
        weatherMatch: dto.weatherMatch ?? null,
        styleMatch: dto.styleMatch ?? null,
        ...(dto.generationContext !== undefined
          ? {
              generationContext:
                dto.generationContext as Prisma.InputJsonValue,
            }
          : {}),
      },
      include: {
        event: true,
      },
    });
  }

  async getOutfits(userId: string) {
    const outfits = await this.prisma.outfit.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });

    return { outfits };
  }

  async deleteOutfit(userId: string, outfitId: string) {
    const outfit = await this.prisma.outfit.findFirst({
      where: { id: outfitId, userId },
      select: { id: true },
    });

    if (!outfit) {
      throw new NotFoundException('Outfit not found');
    }

    await this.prisma.outfit.delete({
      where: { id: outfitId },
    });

    return { deleted: true };
  }
}

