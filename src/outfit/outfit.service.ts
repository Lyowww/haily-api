import { Injectable, BadRequestException } from '@nestjs/common';
import { GenerateOutfitDto, SaveOutfitDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Normalize a date to Monday 00:00:00 UTC of that week for consistent DB storage and queries. */
export function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc;
}

/** Parse ISO date string (YYYY-MM-DD) to Date. */
function parseWeekStartDate(weekStartDate: string): Date {
  const d = new Date(weekStartDate + 'T00:00:00.000Z');
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('Invalid weekStartDate. Use YYYY-MM-DD (Monday of the week).');
  }
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export interface OutfitSuggestion {
  id: string;
  style: string;
  items: OutfitItem[];
  confidence: number;
  createdAt: Date;
}

export interface OutfitItem {
  type: string;
  name: string;
  color: string;
  description: string;
}

@Injectable()
export class OutfitService {
  constructor(private prisma: PrismaService) {}
  // TODO: Integrate with AI service for actual outfit generation
  async generateOutfit(dto: GenerateOutfitDto): Promise<OutfitSuggestion[]> {
    // Placeholder implementation
    // This will be replaced with actual AI integration
    return [
      {
        id: '1',
        style: dto.preferredStyle || 'casual',
        items: [
          {
            type: 'top',
            name: 'Classic White T-Shirt',
            color: 'white',
            description: 'A versatile cotton t-shirt',
          },
          {
            type: 'bottom',
            name: 'Slim Fit Jeans',
            color: 'blue',
            description: 'Dark wash denim jeans',
          },
          {
            type: 'shoes',
            name: 'White Sneakers',
            color: 'white',
            description: 'Clean minimalist sneakers',
          },
        ],
        confidence: 0.92,
        createdAt: new Date(),
      },
    ];
  }

  async getSuggestions(_userId: string): Promise<OutfitSuggestion[]> {
    // TODO: Implement database query
    return [];
  }

  async getAvailableStyles(): Promise<string[]> {
    return [
      'casual',
      'formal',
      'business-casual',
      'streetwear',
      'sporty',
      'bohemian',
      'minimalist',
      'vintage',
      'preppy',
      'romantic',
    ];
  }

  async saveOutfit(userId: string, saveOutfitDto: SaveOutfitDto) {
    const now = new Date();
    let weekStartDate: Date;
    let dayIndexMonday0: number;

    if (saveOutfitDto.weekStartDate != null) {
      weekStartDate = parseWeekStartDate(saveOutfitDto.weekStartDate);
      dayIndexMonday0 =
        saveOutfitDto.dayIndex != null
          ? Math.max(0, Math.min(6, Math.floor(saveOutfitDto.dayIndex)))
          : (now.getDay() + 6) % 7;
    } else {
      weekStartDate = getWeekStartDate(now);
      dayIndexMonday0 = (now.getDay() + 6) % 7;
    }

    // Prepare weather JSON
    const weatherData = saveOutfitDto.weather
      ? {
          temperature: saveOutfitDto.weather.temperature,
          condition: saveOutfitDto.weather.condition,
          locationName: saveOutfitDto.weather.locationName,
        }
      : null;

    const uniqueWardrobeItemIds = Array.from(
      new Set((saveOutfitDto.wardrobeItemIds || []).filter((id) => typeof id === 'string' && id.length > 0)),
    );

    const outfit = await this.prisma.outfit.upsert({
      where: {
        userId_weekStartDate_dayIndex: {
          userId,
          weekStartDate,
          dayIndex: dayIndexMonday0,
        },
      },
      create: {
        userId,
        imageUrl: saveOutfitDto.imageUrl,
        promptVersion: saveOutfitDto.prompt,
        status: 'ready',
        weather: weatherData ? JSON.stringify(weatherData) : null,
        weekStartDate,
        dayIndex: dayIndexMonday0,
        outfitItems: uniqueWardrobeItemIds.length
          ? {
              create: uniqueWardrobeItemIds.map((wardrobeItemId) => ({
                wardrobeItemId,
              })),
            }
          : undefined,
      },
      update: {
        imageUrl: saveOutfitDto.imageUrl,
        promptVersion: saveOutfitDto.prompt,
        status: 'ready',
        weather: weatherData ? JSON.stringify(weatherData) : null,
        outfitItems: {
          deleteMany: {},
          ...(uniqueWardrobeItemIds.length
            ? {
                create: uniqueWardrobeItemIds.map((wardrobeItemId) => ({
                  wardrobeItemId,
                })),
              }
            : {}),
        },
      },
    });

    return outfit;
  }

  async getOutfitHistory(userId: string) {
    const outfits = await this.prisma.outfit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { outfits };
  }

  /**
   * Get the weekly outfit plan for a user. Returns all 7 days (0=Monday .. 6=Sunday);
   * each day has outfit data if set, or null.
   */
  async getWeekPlan(userId: string, weekStartDateInput?: string) {
    const weekStart =
      weekStartDateInput != null
        ? parseWeekStartDate(weekStartDateInput)
        : getWeekStartDate(new Date());

    const outfits = await this.prisma.outfit.findMany({
      where: { userId, weekStartDate: weekStart },
      include: { outfitItems: { include: { wardrobeItem: true } } },
      orderBy: { dayIndex: 'asc' },
    });

    const byDay = new Map(outfits.map((o) => [o.dayIndex, o]));
    const days = Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      weekday: WEEKDAY_NAMES[dayIndex],
      outfit: byDay.get(dayIndex) ?? null,
    }));

    return {
      weekStartDate: weekStart.toISOString().slice(0, 10),
      days,
    };
  }

  /**
   * Delete outfit for a specific day in the weekly plan.
   */
  async deleteOutfitForDay(userId: string, weekStartDateInput: string, dayIndex: number) {
    if (dayIndex < 0 || dayIndex > 6) {
      throw new BadRequestException('dayIndex must be 0 (Monday) to 6 (Sunday).');
    }
    const weekStart = parseWeekStartDate(weekStartDateInput);

    const deleted = await this.prisma.outfit.deleteMany({
      where: {
        userId,
        weekStartDate: weekStart,
        dayIndex,
      },
    });

    return { deleted: deleted.count > 0 };
  }
}

