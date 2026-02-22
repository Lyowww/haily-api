import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { recognizeWardrobeItem } from './recognizeWardrobeItem';
import { CutoutService } from '../cutout/cutout.service';

@Injectable()
export class WardrobeService {
  constructor(
    private prisma: PrismaService,
    private cutoutService: CutoutService,
  ) {}

  async addItem(userId: string, category: string, imageUrl: string, tags?: any) {
    console.log('🔍 Starting AI recognition for wardrobe item:', { category, imageUrl });
    
    // Call AI recognition to get metadata
    const metadata = await recognizeWardrobeItem(imageUrl, category);
    
    console.log('✅ AI recognition complete:', metadata);
    
    const created = await this.prisma.wardrobeItem.create({
      data: {
        userId,
        category: metadata.category || category,
        imageUrl,
        productType: metadata.category || category,
        tags: tags ? JSON.stringify(tags) : null,
        // AI-recognized metadata
        colorFamily: metadata.colorFamily,
        colorHex: metadata.colorHex || null,
        styleTags: JSON.stringify(metadata.styleTags || []),
        seasonTags: JSON.stringify(metadata.seasonTags || []),
        fitTag: metadata.fitTag || 'unknown',
        extraTags: metadata.extraTags ? JSON.stringify(metadata.extraTags) : null,
        confidence: JSON.stringify(metadata.confidence),
        rawAiJson: metadata.rawAiJson || null,
        userNotes: metadata.notes || null,
      },
    });

    // Generate background-removed cutout (best-effort).
    const cutout = await this.cutoutService.generateCutoutForImageUrl(imageUrl);
    if (cutout?.cutoutUrl) {
      return this.prisma.wardrobeItem.update({
        where: { id: created.id },
        data: {
          cutoutImageUrl: cutout.cutoutUrl,
          cutoutStatus: 'ready',
          cutoutError: null,
        },
      });
    }

    // Mark failure so clients can fall back to original image.
    return this.prisma.wardrobeItem.update({
      where: { id: created.id },
      data: {
        cutoutStatus: 'failed',
        cutoutError: 'cutout_generation_failed',
      },
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
    return this.prisma.wardrobeItem.delete({
      where: { id: itemId, userId },
    });
  }

  async updateItem(
    userId: string,
    itemId: string,
    updates: { seasonTags?: string[] },
  ) {
    const data: any = {};

    if (updates.seasonTags) {
      data.seasonTags = JSON.stringify(updates.seasonTags);
    }

    return this.prisma.wardrobeItem.update({
      where: { id: itemId, userId },
      data,
    });
  }
}

