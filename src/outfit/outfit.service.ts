import { Injectable } from '@nestjs/common';
import { GenerateOutfitDto, SaveOutfitDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

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
    const dayIndexMonday0 = (now.getDay() + 6) % 7; // JS: 0=Sun ... -> 0=Mon
    const weekStartDate = new Date(now);
    weekStartDate.setHours(0, 0, 0, 0);
    // Move back to Monday
    weekStartDate.setDate(weekStartDate.getDate() - dayIndexMonday0);

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
}

