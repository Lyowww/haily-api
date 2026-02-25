import { Injectable, BadRequestException } from '@nestjs/common';
import { GenerateOutfitDto, SaveOutfitDto, GenerateWeekPlanDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather/weather.service';
import { AIService } from '../ai/ai.service';
import type { DayWeather } from '../weather/weather.service';
import { SeasonTag } from '../wardrobe/enums';

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const COLD_MAX_C = 12;
const HOT_MIN_C = 24;

type WardrobeItemRow = { id: string; category: string; seasonTags: string | null; imageUrl: string };
function isTop(c: string): boolean {
  const lower = c.toLowerCase();
  return ['top', 'tops', 'outerwear', 'jacket', 'jackets', 'coat', 'coats', 'shirt', 'tshirt', 't-shirt', 'blouse', 'sweater', 'hoodie', 'tank', 'polo'].some((x) => lower.includes(x));
}
function isBottom(c: string): boolean {
  const lower = c.toLowerCase();
  return ['bottom', 'bottoms', 'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings'].some((x) => lower.includes(x));
}
function isShoes(c: string): boolean {
  const lower = c.toLowerCase();
  return ['shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'].some((x) => lower.includes(x));
}
function isOuterwear(c: string): boolean {
  const lower = c.toLowerCase();
  return ['outerwear', 'jacket', 'jackets', 'coat', 'coats', 'blazer', 'cardigan', 'vest'].some((x) => lower.includes(x));
}

function parseSeasonTags(json: string | null): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

/** Sort items: for cold day prefer winter/outerwear first; for hot day prefer summer first. */
function sortByWeatherSuitability<T extends { seasonTags: string | null }>(items: T[], wantWarm: boolean): T[] {
  return [...items].sort((a, b) => {
    const aTags = parseSeasonTags(a.seasonTags);
    const bTags = parseSeasonTags(b.seasonTags);
    const aWinter = aTags.includes(SeasonTag.WINTER) ? 1 : 0;
    const bWinter = bTags.includes(SeasonTag.WINTER) ? 1 : 0;
    const aSummer = aTags.includes(SeasonTag.SUMMER) ? 1 : 0;
    const bSummer = bTags.includes(SeasonTag.SUMMER) ? 1 : 0;
    if (wantWarm) return bWinter - aWinter || aSummer - bSummer;
    return bSummer - aSummer || aWinter - bWinter;
  });
}

function pickOneByDayIndex<T>(items: T[], dayIndex: number): T | null {
  if (items.length === 0) return null;
  const i = dayIndex % items.length;
  return items[i];
}

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

interface WardrobeByCategory {
  tops: WardrobeItemRow[];
  bottoms: WardrobeItemRow[];
  shoes: WardrobeItemRow[];
  outerwear: WardrobeItemRow[];
}

@Injectable()
export class OutfitService {
  constructor(
    private prisma: PrismaService,
    private weatherService: WeatherService,
    private aiService: AIService,
  ) {}
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
   * Pick one outfit (top + bottom + shoes, optionally outerwear) from wardrobe for a day
   * based on weather and dayIndex for variety. Returns wardrobeItemIds and weather payload for save.
   */
  private pickOutfitForDay(
    byCat: WardrobeByCategory,
    dayWeather: DayWeather,
    dayIndex: number,
  ): { wardrobeItemIds: string[]; weather: { temperature: number; condition: string; locationName: string } } {
    const needCold = dayWeather.maxTempC <= COLD_MAX_C;
    const needHot = dayWeather.minTempC >= HOT_MIN_C;
    const wantWarm = needCold;

    const tops = sortByWeatherSuitability(byCat.tops, wantWarm);
    const bottoms = sortByWeatherSuitability(byCat.bottoms, wantWarm);
    const shoes = sortByWeatherSuitability(byCat.shoes, wantWarm);
    const outerwear = sortByWeatherSuitability(byCat.outerwear, true);

    const top = pickOneByDayIndex(tops, dayIndex);
    const bottom = pickOneByDayIndex(bottoms, dayIndex + 1);
    const shoesItem = pickOneByDayIndex(shoes, dayIndex + 2);
    const coat = needCold ? pickOneByDayIndex(outerwear, dayIndex) : null;

    const ids: string[] = [];
    if (top) ids.push(top.id);
    if (coat) ids.push(coat.id);
    if (bottom) ids.push(bottom.id);
    if (shoesItem) ids.push(shoesItem.id);

    const avgTemp = Math.round((dayWeather.minTempC + dayWeather.maxTempC) / 2);
    return {
      wardrobeItemIds: ids,
      weather: {
        temperature: avgTemp,
        condition: dayWeather.condition,
        locationName: '',
      },
    };
  }

  /**
   * Generate 7 AI outfit images (one per day) from the user's wardrobe and weather.
   * Long-running request: mobile app keeps the connection open (~1–2 min) and receives
   * an array of days with generated imageUrl per day. User profile image is always
   * sent to AI so the face is preserved 100%.
   */
  async generateWeekPlan(userId: string, dto: GenerateWeekPlanDto) {
    const weekStart = parseWeekStartDate(dto.weekStartDate);
    const weekStartDateStr = weekStart.toISOString().slice(0, 10);

    const [wardrobeItems, location, user] = await Promise.all([
      this.prisma.wardrobeItem.findMany({
        where: { userId },
        select: { id: true, category: true, seasonTags: true, imageUrl: true },
      }),
      (async () => {
        if (dto.latitude != null && dto.longitude != null) {
          return { latitude: dto.latitude, longitude: dto.longitude, timezone: dto.timezone };
        }
        const settings = await this.prisma.notificationSettings.findUnique({
          where: { userId },
          select: { latitude: true, longitude: true, timezone: true },
        });
        if (settings?.latitude != null && settings?.longitude != null) {
          return {
            latitude: settings.latitude,
            longitude: settings.longitude,
            timezone: settings.timezone ?? dto.timezone,
          };
        }
        return null;
      })(),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatarBaseImageUrl: true },
      }),
    ]);

    const userPhotoBase64 = dto.userImage?.trim() || null;
    const userPhotoUrl = user?.avatarBaseImageUrl ?? '';
    if (!userPhotoBase64 && !userPhotoUrl) {
      throw new BadRequestException(
        'Profile image is required for AI outfit generation. Send userImage (base64) in the request body or set the user avatar (avatarBaseImageUrl) in the app.',
      );
    }

    const weekWeather: DayWeather[] = location
      ? await this.weatherService.getWeekForecast({
          latitude: location.latitude,
          longitude: location.longitude,
          timezone: location.timezone,
          weekStartDate: weekStartDateStr,
        })
      : (() => {
          const base = new Date(weekStart.getTime());
          return Array.from({ length: 7 }, (_, dayIndex) => {
            const d = new Date(base);
            d.setUTCDate(d.getUTCDate() + dayIndex);
            return {
              dayIndex,
              date: d.toISOString().slice(0, 10),
              minTempC: 15,
              maxTempC: 22,
              condition: 'clear',
            };
          });
        })();

    const byCat: WardrobeByCategory = {
      tops: wardrobeItems.filter((i) => isTop(i.category)),
      bottoms: wardrobeItems.filter((i) => isBottom(i.category)),
      shoes: wardrobeItems.filter((i) => isShoes(i.category)),
      outerwear: wardrobeItems.filter((i) => isOuterwear(i.category)),
    };

    const dayPlans = weekWeather.map((dw) => {
      const picked = this.pickOutfitForDay(byCat, dw, dw.dayIndex);
      return { dayIndex: dw.dayIndex, wardrobeItemIds: picked.wardrobeItemIds, weather: picked.weather };
    });

    const wardrobeById = new Map(wardrobeItems.map((i) => [i.id, i]));

    const days: Array<{
      dayIndex: number;
      weekday: string;
      imageUrl: string | null;
      outfit: Awaited<ReturnType<typeof this.prisma.outfit.upsert>>;
      weather: { temperature: number; condition: string; locationName: string };
    }> = [];

    for (const plan of dayPlans) {
      const clothingItems = plan.wardrobeItemIds
        .map((id) => wardrobeById.get(id))
        .filter((item): item is WardrobeItemRow => item != null)
        .map((item) => ({ id: item.id, category: item.category, imageUrl: item.imageUrl }));

      let imageUrl: string | null = null;
      let promptVersion: string | null = null;

      if (clothingItems.length > 0) {
        try {
          const result = await this.aiService.generateOutfitImage({
            userPhotoUrl,
            userPhotoBase64: userPhotoBase64 ?? undefined,
            clothingItems,
            weather: {
              temperature: plan.weather.temperature,
              condition: plan.weather.condition,
            },
            stylePrompt: dto.preferredStyle ? `Style: ${dto.preferredStyle}.` : undefined,
          });
          imageUrl = result.imageUrl;
          promptVersion = result.prompt;
        } catch (err) {
          console.error(`AI outfit generation failed for day ${plan.dayIndex}:`, err);
          // Continue: save outfit without image so UI can show placeholder or retry
        }
      }

      const outfit = await this.prisma.outfit.upsert({
        where: {
          userId_weekStartDate_dayIndex: {
            userId,
            weekStartDate: weekStart,
            dayIndex: plan.dayIndex,
          },
        },
        create: {
          userId,
          weekStartDate: weekStart,
          dayIndex: plan.dayIndex,
          status: 'ready',
          imageUrl,
          promptVersion,
          weather: JSON.stringify({
            temperature: plan.weather.temperature,
            condition: plan.weather.condition,
            locationName: plan.weather.locationName,
          }),
          outfitItems:
            plan.wardrobeItemIds.length > 0
              ? { create: plan.wardrobeItemIds.map((wardrobeItemId) => ({ wardrobeItemId })) }
              : undefined,
        },
        update: {
          status: 'ready',
          ...(imageUrl != null && { imageUrl }),
          ...(promptVersion != null && { promptVersion }),
          weather: JSON.stringify({
            temperature: plan.weather.temperature,
            condition: plan.weather.condition,
            locationName: plan.weather.locationName,
          }),
          outfitItems: {
            deleteMany: {},
            ...(plan.wardrobeItemIds.length > 0
              ? { create: plan.wardrobeItemIds.map((wardrobeItemId) => ({ wardrobeItemId })) }
              : {}),
          },
        },
        include: { outfitItems: { include: { wardrobeItem: true } } },
      });

      days.push({
        dayIndex: outfit.dayIndex,
        weekday: WEEKDAY_NAMES[outfit.dayIndex],
        imageUrl,
        outfit,
        weather: plan.weather,
      });
    }

    return {
      weekStartDate: weekStartDateStr,
      days,
    };
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

