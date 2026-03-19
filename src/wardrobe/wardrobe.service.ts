import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AIService, WardrobeMetadataResult } from '../ai/ai.service';
import { UploadService } from '../upload/upload.service';
import { AddWardrobeItemDto } from './dto/add-wardrobe-item.dto';
import { UpdateWardrobeItemDto } from './dto/update-wardrobe-item.dto';
import { UploadWardrobeItemDto } from './dto/upload-wardrobe-item.dto';

@Injectable()
export class WardrobeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly uploadService: UploadService,
  ) {}

  private buildItemCreateData(
    userId: string,
    metadata: WardrobeMetadataResult,
    imageUrl: string,
    overrides?: Partial<AddWardrobeItemDto>,
  ) {
    const tags = Array.from(
      new Set([...(metadata.tags ?? []), ...(overrides?.tags ?? [])].filter(Boolean)),
    );
    const seasons = Array.from(
      new Set(
        [
          ...(metadata.seasons ?? []),
          ...(overrides?.seasons ?? []),
        ].filter(Boolean),
      ),
    );
    const occasions = Array.from(
      new Set(
        [
          ...(metadata.occasions ?? []),
          ...(overrides?.occasions ?? []),
        ].filter(Boolean),
      ),
    );

    return {
      userId,
      name: overrides?.name ?? metadata.name,
      category: overrides?.category ?? metadata.category,
      subcategory: overrides?.subcategory ?? metadata.subcategory,
      imageUrl,
      aiDescription: overrides?.aiDescription ?? metadata.aiDescription,
      seasons,
      ...(overrides?.temperatureRange !== undefined || metadata.temperatureRange
        ? {
            temperatureRange: this.toTemperatureRangeJson(
              overrides?.temperatureRange ?? metadata.temperatureRange,
            ),
          }
        : {}),
      occasions,
      tags,
      colorFamily: metadata.colorFamily,
      colorHex: metadata.colorHex ?? null,
      styleTags: JSON.stringify(metadata.styleTags ?? []),
      seasonTags: JSON.stringify(metadata.seasons ?? []),
      fitTag: metadata.fitTag ?? 'unknown',
      rawAiJson: metadata.rawAiJson ?? null,
      productType: metadata.subcategory ?? metadata.category,
      cutoutStatus: 'pending',
    };
  }

  async addItem(userId: string, dto: AddWardrobeItemDto) {
    return this.prisma.wardrobeItem.create({
      data: {
        userId,
        name: dto.name,
        category: dto.category,
        subcategory: dto.subcategory ?? null,
        imageUrl: dto.imageUrl,
        aiDescription: dto.aiDescription ?? null,
        seasons: dto.seasons ?? [],
        ...(dto.temperatureRange !== undefined
          ? {
              temperatureRange: this.toTemperatureRangeJson(dto.temperatureRange),
            }
          : {}),
        occasions: dto.occasions ?? [],
        tags: dto.tags ?? [],
        productType: dto.subcategory ?? dto.category,
      },
    });
  }

  async uploadAndCreateItem(
    userId: string,
    file: Express.Multer.File,
    dto: UploadWardrobeItemDto,
  ) {
    const upload = await this.uploadService.uploadFile(file);
    const metadata = await this.aiService.classifyWardrobeItemFromImage({
      imageUrl: upload.url,
      name: dto.name,
      categoryHint: dto.categoryHint,
    });

    return this.prisma.wardrobeItem.create({
      data: this.buildItemCreateData(userId, metadata, upload.url, {
        name: dto.name ?? metadata.name,
        category: dto.categoryHint ?? metadata.category,
      }),
    });
  }

  async getUserWardrobe(userId: string) {
    return this.prisma.wardrobeItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getItemsByCategory(userId: string, category: string) {
    return this.prisma.wardrobeItem.findMany({
      where: { userId, category },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteItem(userId: string, itemId: string) {
    const deleted = await this.prisma.wardrobeItem.deleteMany({
      where: { id: itemId, userId },
    });

    return { deleted: deleted.count > 0 };
  }

  async updateItem(userId: string, itemId: string, updates: UpdateWardrobeItemDto) {
    const existing = await this.prisma.wardrobeItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Wardrobe item not found');
    }

    return this.prisma.wardrobeItem.update({
      where: { id: itemId },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(updates.subcategory !== undefined
          ? { subcategory: updates.subcategory }
          : {}),
        ...(updates.aiDescription !== undefined
          ? { aiDescription: updates.aiDescription }
          : {}),
        ...(updates.seasons !== undefined ? { seasons: updates.seasons } : {}),
        ...(updates.temperatureRange !== undefined
          ? {
              temperatureRange: this.toTemperatureRangeJson(
                updates.temperatureRange,
              ),
            }
          : {}),
        ...(updates.occasions !== undefined ? { occasions: updates.occasions } : {}),
        ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
      },
    });
  }

  private toTemperatureRangeJson(value: {
    minC: number;
    maxC: number;
  }): Prisma.InputJsonValue {
    return {
      minC: value.minC,
      maxC: value.maxC,
    };
  }
}

