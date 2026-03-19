import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config';
import OpenAI from 'openai';
import { AnalyzeWardrobeDto } from './dto/analyze-wardrobe.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const heicConvert = require('heic-convert') as (options: { buffer: Buffer; format: 'PNG' | 'JPEG'; quality?: number }) => Promise<Buffer>;
import { CutoutService } from '../cutout/cutout.service';
import { UploadService } from '../upload/upload.service';
import { S3Service } from '../upload/s3.service';
import { getUploadsRoot } from '../utils/uploads-path';

interface OutfitGenerationRequest {
  userPhotoUrl: string;
  /** Optional base64 image data. Use when URL is not reachable (e.g. same-host on Vercel). */
  userPhotoBase64?: string;
  /** When using Puter.js client-side generation: pass the data URL from generateAIImage result (image.src). */
  generatedImageDataUrl?: string;
  user?: {
    sex?: 'male' | 'female';
    age?: number;
    heightCm?: number;
  };
  clothingItems: {
    id: string;
    category: string;
    imageUrl: string;
  }[];
  weather?: {
    temperature: number;
    condition: string;
  };
  stylePrompt?: string;
}

export interface WardrobeAnalysisResult {
  isComplete: boolean;
  missingItems: string[];
  recommendations: string[];
}

export interface WardrobeMetadataResult {
  name: string;
  category: string;
  subcategory: string | null;
  seasons: string[];
  temperatureRange: { minC: number; maxC: number };
  occasions: string[];
  tags: string[];
  aiDescription: string;
  colorFamily: string;
  colorHex?: string;
  styleTags: string[];
  fitTag: string;
  rawAiJson?: string;
}

export interface OutfitRecommendationInput {
  wardrobeItems: Array<{
    id: string;
    name: string | null;
    category: string;
    subcategory: string | null;
    seasons: string[];
    occasions: string[];
    tags: string[];
    temperatureRange?: { minC?: number; maxC?: number } | null;
  }>;
  tasteProfile?: Record<string, any> | null;
  event?: {
    id?: string;
    name: string;
    type?: string | null;
    date?: string;
  } | null;
  customEventText?: string | null;
  weather?: {
    temperatureC?: number;
    minTempC?: number;
    maxTempC?: number;
    condition?: string;
    date?: string;
  } | null;
  dateLabel?: 'today' | 'tomorrow';
}

export interface OutfitRecommendationResult {
  outfitItemIds: string[];
  explanation: string;
  weatherMatch: boolean;
  styleMatch: boolean;
}

export interface OutfitMoodImageResult {
  imageUrl: string;
  prompt: string;
  source: 'ai' | 'fallback';
}

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private cutoutService: CutoutService,
    private uploadService: UploadService,
    private s3Service: S3Service,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.openAiApiKey,
    });
  }

  private get hasOpenAi(): boolean {
    return !!this.configService.openAiApiKey;
  }

  private normalizeStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input
      .map((value) => String(value).trim().toLowerCase())
      .filter((value) => value.length > 0);
  }

  private parseJsonObject<T>(raw: string): T {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as T;
  }

  private resolvePublicUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    return `http://localhost:${this.configService.port ?? 3000}${pathOrUrl}`;
  }

  private inferCategoryFromText(text: string): { category: string; subcategory: string | null } {
    const value = text.toLowerCase();
    const rules: Array<{ match: RegExp; category: string; subcategory: string }> = [
      { match: /\b(t-shirt|tee|shirt|blouse|hoodie|sweater|top|polo)\b/, category: 'tops', subcategory: 't-shirt' },
      { match: /\b(jeans|trousers|pants|shorts|skirt|bottom)\b/, category: 'bottoms', subcategory: 'trousers' },
      { match: /\b(jacket|coat|blazer|outerwear|cardigan)\b/, category: 'outerwear', subcategory: 'jacket' },
      { match: /\b(dress|jumpsuit)\b/, category: 'dresses_jumpsuits', subcategory: 'dress' },
      { match: /\b(sneakers|boots|heels|sandals|shoes|loafers)\b/, category: 'shoes', subcategory: 'sneakers' },
    ];

    for (const rule of rules) {
      if (rule.match.test(value)) {
        return { category: rule.category, subcategory: rule.subcategory };
      }
    }

    return { category: 'tops', subcategory: null };
  }

  private normalizeWardrobeCategory(
    value: unknown,
    fallback: string = 'tops',
  ): string {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized) return fallback;

    const direct = new Set([
      'tops',
      'bottoms',
      'outerwear',
      'dresses_jumpsuits',
      'shoes',
    ]);
    if (direct.has(normalized)) return normalized;

    const synonyms: Record<string, string> = {
      top: 'tops',
      bottom: 'bottoms',
      dress: 'dresses_jumpsuits',
      dresses: 'dresses_jumpsuits',
      jumpsuit: 'dresses_jumpsuits',
      jumpsuits: 'dresses_jumpsuits',
      shoe: 'shoes',
      sneaker: 'shoes',
      sneakers: 'shoes',
      boots: 'shoes',
      heels: 'shoes',
      sandals: 'shoes',
      loafers: 'shoes',
      jacket: 'outerwear',
      coat: 'outerwear',
      blazer: 'outerwear',
      cardigan: 'outerwear',
      hoodie: 'tops',
      sweater: 'tops',
      shirt: 'tops',
      't-shirt': 'tops',
      tee: 'tops',
      blouse: 'tops',
      jeans: 'bottoms',
      pants: 'bottoms',
      trousers: 'bottoms',
      shorts: 'bottoms',
      skirt: 'bottoms',
    };

    return synonyms[normalized] ?? fallback;
  }

  private fallbackWardrobeMetadata(params: {
    imageUrl: string;
    name?: string;
    categoryHint?: string;
  }): WardrobeMetadataResult {
    const inferred = this.inferCategoryFromText(
      `${params.name ?? ''} ${params.categoryHint ?? ''}`,
    );

    return {
      name: params.name?.trim() || inferred.subcategory || 'Wardrobe item',
      category: this.normalizeWardrobeCategory(
        params.categoryHint ?? inferred.category,
        inferred.category,
      ),
      subcategory: inferred.subcategory,
      seasons: ['all_season'],
      temperatureRange: { minC: 12, maxC: 24 },
      occasions: ['daily'],
      tags: [inferred.category, ...(inferred.subcategory ? [inferred.subcategory] : [])],
      aiDescription:
        'AI metadata fallback was used, so this item has a generic wardrobe description.',
      colorFamily: 'unknown',
      styleTags: [],
      fitTag: 'unknown',
      rawAiJson: JSON.stringify({
        provider: 'fallback',
        imageUrl: params.imageUrl,
      }),
    };
  }

  async classifyWardrobeItemFromImage(params: {
    imageUrl: string;
    name?: string;
    categoryHint?: string;
  }): Promise<WardrobeMetadataResult> {
    if (!this.hasOpenAi) {
      return this.fallbackWardrobeMetadata(params);
    }

    try {
      const preparedImage = await this.readImageBuffer(params.imageUrl);
      const imageDataUrl = `data:${preparedImage.mimeType};base64,${preparedImage.buffer.toString('base64')}`;
      const prompt = `You are an apparel metadata engine.
Return ONLY valid JSON with this exact shape:
{
  "name": "short human-readable item name",
  "category": "one of tops, bottoms, outerwear, dresses_jumpsuits, shoes",
  "subcategory": "specific subtype like t-shirt, jeans, blazer, sneakers",
  "seasons": ["winter", "spring", "summer", "autumn"],
  "temperatureRange": { "minC": 0, "maxC": 30 },
  "occasions": ["daily", "work", "party", "travel", "formal", "casual"],
  "tags": ["style or material tags"],
  "aiDescription": "1-2 sentence wardrobe description",
  "colorFamily": "dominant color family",
  "colorHex": "#RRGGBB or null",
  "styleTags": ["casual", "streetwear", "classic", "minimal", "smart_casual"],
  "fitTag": "slim | regular | relaxed | oversized | unknown"
}

Rules:
- Be deterministic and conservative.
- Use Celsius.
- If uncertain, still choose the closest valid category.
- Do not include markdown.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${prompt}\nCategory hint: ${params.categoryHint ?? 'none'}\nItem name hint: ${params.name ?? 'none'}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        return this.fallbackWardrobeMetadata(params);
      }

      const parsed = this.parseJsonObject<any>(raw);
      const inferred = this.inferCategoryFromText(
        `${parsed.name ?? ''} ${parsed.category ?? ''} ${parsed.subcategory ?? ''}`,
      );

      return {
        name: String(parsed.name ?? params.name ?? inferred.subcategory ?? 'Wardrobe item'),
        category: this.normalizeWardrobeCategory(
          parsed.category ?? params.categoryHint ?? inferred.category,
          inferred.category,
        ),
        subcategory: parsed.subcategory ? String(parsed.subcategory).toLowerCase() : inferred.subcategory,
        seasons: this.normalizeStringArray(parsed.seasons),
        temperatureRange: {
          minC: Number(parsed?.temperatureRange?.minC ?? 12),
          maxC: Number(parsed?.temperatureRange?.maxC ?? 24),
        },
        occasions: this.normalizeStringArray(parsed.occasions),
        tags: this.normalizeStringArray(parsed.tags),
        aiDescription: String(
          parsed.aiDescription ??
            'AI analyzed this item and generated a concise wardrobe description.',
        ),
        colorFamily: String(parsed.colorFamily ?? 'unknown').toLowerCase(),
        colorHex: parsed.colorHex ? String(parsed.colorHex) : undefined,
        styleTags: this.normalizeStringArray(parsed.styleTags),
        fitTag: String(parsed.fitTag ?? 'unknown').toLowerCase(),
        rawAiJson: raw,
      };
    } catch (error) {
      console.error('Error classifying wardrobe item:', error);
      return this.fallbackWardrobeMetadata(params);
    }
  }

  private itemMatchesWeather(
    item: OutfitRecommendationInput['wardrobeItems'][number],
    targetTemp: number,
  ): boolean {
    const min = Number(item.temperatureRange?.minC ?? 0);
    const max = Number(item.temperatureRange?.maxC ?? 40);
    return targetTemp >= min && targetTemp <= max;
  }

  private pickBestByScore(
    items: OutfitRecommendationInput['wardrobeItems'],
    scoreFn: (
      item: OutfitRecommendationInput['wardrobeItems'][number],
      index: number,
    ) => number,
  ) {
    return [...items]
      .map((item, index) => ({ item, score: scoreFn(item, index) }))
      .sort((a, b) => b.score - a.score)[0]?.item ?? null;
  }

  private fallbackOutfitRecommendation(
    input: OutfitRecommendationInput,
  ): OutfitRecommendationResult {
    const targetTemp = Number(
      input.weather?.temperatureC ??
        (Number(input.weather?.minTempC ?? 18) +
          Number(input.weather?.maxTempC ?? 22)) /
          2,
    );
    const tasteValues = Object.values(input.tasteProfile ?? {}).map((entry: any) =>
      String(entry?.value ?? '').toLowerCase(),
    );
    const eventText = `${input.event?.name ?? ''} ${input.event?.type ?? ''} ${
      input.customEventText ?? ''
    }`.toLowerCase();

    const scoreItem = (
      item: OutfitRecommendationInput['wardrobeItems'][number],
      base: number,
    ) => {
      let score = base;
      if (this.itemMatchesWeather(item, targetTemp)) score += 3;
      if (item.occasions.some((occasion) => eventText.includes(occasion))) score += 2;
      if (item.tags.some((tag) => tasteValues.includes(tag))) score += 2;
      if (item.tags.some((tag) => eventText.includes(tag))) score += 1;
      return score;
    };

    const tops = input.wardrobeItems.filter((item) =>
      ['tops', 'dresses_jumpsuits'].includes(item.category),
    );
    const bottoms = input.wardrobeItems.filter((item) => item.category === 'bottoms');
    const shoes = input.wardrobeItems.filter((item) => item.category === 'shoes');
    const outerwear = input.wardrobeItems.filter(
      (item) => item.category === 'outerwear',
    );

    const top = this.pickBestByScore(tops, (item) => scoreItem(item, 5));
    const bottom =
      top?.category === 'dresses_jumpsuits'
        ? null
        : this.pickBestByScore(bottoms, (item) => scoreItem(item, 4));
    const shoe = this.pickBestByScore(shoes, (item) => scoreItem(item, 4));
    const coat =
      targetTemp <= 12 ||
      tasteValues.includes('runs_cold') ||
      tasteValues.includes('layering')
        ? this.pickBestByScore(outerwear, (item) => scoreItem(item, 3))
        : null;

    const outfitItemIds = [top?.id, bottom?.id, shoe?.id, coat?.id].filter(
      (value): value is string => !!value,
    );

    return {
      outfitItemIds,
      explanation:
        'This outfit was selected with the built-in fallback matcher using weather, event context, and onboarding preferences.',
      weatherMatch: outfitItemIds.length > 0,
      styleMatch: outfitItemIds.length > 0,
    };
  }

  async generateStructuredOutfitRecommendation(
    input: OutfitRecommendationInput,
  ): Promise<OutfitRecommendationResult> {
    if (!input.wardrobeItems.length) {
      return {
        outfitItemIds: [],
        explanation: 'No wardrobe items are available for recommendation.',
        weatherMatch: false,
        styleMatch: false,
      };
    }

    if (!this.hasOpenAi) {
      return this.fallbackOutfitRecommendation(input);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a wardrobe recommendation engine. Return deterministic JSON only and choose items that fit weather, event context, and user taste.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              instructions: {
                allowedCategories: [
                  'tops',
                  'bottoms',
                  'outerwear',
                  'dresses_jumpsuits',
                  'shoes',
                ],
                outputShape: {
                  topItemId: 'string | null',
                  bottomItemId: 'string | null',
                  shoesItemId: 'string | null',
                  outerwearItemId: 'string | null',
                  explanation: 'string',
                  weatherMatch: 'boolean',
                  styleMatch: 'boolean',
                },
              },
              input,
            }),
          },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        return this.fallbackOutfitRecommendation(input);
      }

      const parsed = this.parseJsonObject<any>(raw);
      const outfitItemIds = [
        parsed.topItemId,
        parsed.bottomItemId,
        parsed.shoesItemId,
        parsed.outerwearItemId,
      ]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .filter((value, index, array) => array.indexOf(value) === index);

      return {
        outfitItemIds,
        explanation: String(
          parsed.explanation ??
            'The outfit was generated from your wardrobe and profile preferences.',
        ),
        weatherMatch: Boolean(parsed.weatherMatch),
        styleMatch: Boolean(parsed.styleMatch),
      };
    } catch (error) {
      console.error('Error generating structured outfit recommendation:', error);
      return this.fallbackOutfitRecommendation(input);
    }
  }

  async generateOutfitMoodImage(params: {
    eventName?: string | null;
    eventType?: string | null;
    customEventText?: string | null;
    dateLabel?: 'today' | 'tomorrow';
    weather?: {
      condition?: string;
      temperatureC?: number;
      minTempC?: number;
      maxTempC?: number;
    } | null;
  }): Promise<OutfitMoodImageResult> {
    const eventText = [
      params.eventName ?? '',
      params.eventType ?? '',
      params.customEventText ?? '',
    ]
      .join(' ')
      .trim();
    const weatherText = params.weather
      ? `${params.weather.condition ?? 'clear'} ${Math.round(
          Number(
            params.weather.temperatureC ??
              (Number(params.weather.minTempC ?? 18) +
                Number(params.weather.maxTempC ?? 24)) /
                2,
          ),
        )}C`
      : 'clear 22C';
    const prompt =
      `Stylish editorial mood board image for a fashion outfit recommendation. ` +
      `Theme: ${eventText || 'daily city style'}. ` +
      `Weather context: ${weatherText}. ` +
      `Aesthetic: cinematic lighting, elegant composition, rich colors, modern, aspirational, no text, no logos, no watermarks.`;

    if (this.hasOpenAi) {
      try {
        const response = await this.openai.images.generate({
          model: 'gpt-image-1',
          prompt,
          size: '1024x1024',
          n: 1,
        });
        const imageUrl = response.data?.[0]?.url;
        const imageB64 = response.data?.[0]?.b64_json;
        const filename = `generated/mood-${Date.now()}.png`;

        if (imageB64) {
          const buffer = Buffer.from(imageB64, 'base64');
          const uploaded = await this.uploadService.uploadBuffer(
            buffer,
            filename,
            'image/png',
          );
          return {
            imageUrl: this.resolvePublicUrl(uploaded.url),
            prompt,
            source: 'ai',
          };
        }

        if (imageUrl) {
          const storedUrl = await this.downloadAndSaveImage(
            imageUrl,
            `mood-${Date.now()}.png`,
          );
          return {
            imageUrl: this.resolvePublicUrl(storedUrl),
            prompt,
            source: 'ai',
          };
        }
      } catch (error) {
        console.warn('Falling back to generated mood placeholder image:', error);
      }
    }

    const safeTheme = (eventText || 'daily style')
      .replace(/[<>&"]/g, '')
      .slice(0, 80);
    const safeWeather = weatherText.replace(/[<>&"]/g, '').slice(0, 50);
    const safeDate = (params.dateLabel ?? 'today').replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2B2D42"/>
      <stop offset="45%" stop-color="#3A506B"/>
      <stop offset="100%" stop-color="#5BC0BE"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <circle cx="830" cy="220" r="160" fill="#FFFFFF22"/>
  <circle cx="210" cy="860" r="220" fill="#FFFFFF14"/>
  <text x="80" y="760" fill="#F8F9FA" font-family="Arial, sans-serif" font-size="40" opacity="0.95">Style mood</text>
  <text x="80" y="815" fill="#F8F9FA" font-family="Arial, sans-serif" font-size="56" font-weight="700">${safeTheme}</text>
  <text x="80" y="875" fill="#E9ECEF" font-family="Arial, sans-serif" font-size="32">${safeWeather} · ${safeDate}</text>
</svg>`;
    const fallbackUpload = await this.uploadService.uploadBuffer(
      Buffer.from(svg),
      `generated/mood-fallback-${Date.now()}.svg`,
      'image/svg+xml',
    );

    return {
      imageUrl: this.resolvePublicUrl(fallbackUpload.url),
      prompt,
      source: 'fallback',
    };
  }

  /**
   * Detect HEIC/HEIF by file signature (ftyp + heic/heix/hevc/mif1/msf1).
   */
  private isHeicBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 12) return false;
    if (buffer[4] !== 0x66 || buffer[5] !== 0x74 || buffer[6] !== 0x79 || buffer[7] !== 0x70) return false;
    const brand = buffer.toString('ascii', 8, 12);
    return ['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand);
  }

  /**
   * Normalize any supported image buffer to PNG so Sharp and downstream always get a known-good format.
   * Supports JPEG, PNG, WebP (via Sharp) and HEIC/HEIF (via heic-convert, e.g. iPhone photos).
   */
  private async normalizeImageToPng(inputBuffer: Buffer): Promise<Buffer> {
    if (!inputBuffer?.length) {
      throw new BadRequestException('Empty image data.');
    }
    if (this.isHeicBuffer(inputBuffer)) {
      try {
        return await heicConvert({ buffer: inputBuffer, format: 'PNG' });
      } catch (err: any) {
        console.error('HEIC conversion failed:', err?.message ?? err);
        throw new BadRequestException(
          'Failed to convert HEIC image. Please use JPEG or PNG, or try re-exporting the photo from your device.',
        );
      }
    }
    try {
      return await sharp(inputBuffer).png().toBuffer();
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes('unsupported') || msg.includes('format')) {
        try {
          return await heicConvert({ buffer: inputBuffer, format: 'PNG' });
        } catch {
          throw new BadRequestException(
            'Unsupported image format. Please use JPEG, PNG, or HEIC for the user photo and clothing images.',
          );
        }
      }
      throw err;
    }
  }

  /**
   * Adds padding around image to prevent model cropping
   * @param inputBuffer Image buffer
   * @param padPercent Padding percentage (0.2 = 20% on each side)
   */
  private async padImageToSafeFrame(inputBuffer: Buffer, padPercent = 0.2): Promise<Buffer> {
    try {
      const img = sharp(inputBuffer);
      const meta = await img.metadata();

      if (!meta.width || !meta.height) {
        throw new Error('Invalid image metadata');
      }

      const padX = Math.round(meta.width * padPercent);
      const padY = Math.round(meta.height * padPercent);

      // Use neutral gray background (matches studio vibe)
      const padded = await img
        .extend({
          top: padY,
          bottom: padY,
          left: padX,
          right: padX,
          background: { r: 230, g: 230, b: 230, alpha: 1 },
        })
        .png()
        .toBuffer();

      console.log(`✅ Added ${padPercent * 100}% padding to prevent cropping`);
      return padded;
    } catch (error) {
      console.error('❌ Error padding image:', error);
      // Return original if padding fails
      return inputBuffer;
    }
  }

  /**
   * Convert URL to local buffer and detect mime type
   */
  private resolveLocalUploadsPath(imageUrl: string): string | null {
    if (!imageUrl || typeof imageUrl !== 'string') return null;

    // S3 or other remote URL — must download, not read from disk
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        const host = parsed.hostname || '';
        if (host.includes('s3.') && host.includes('amazonaws.com')) return null;
        if (host !== 'localhost' && host !== '127.0.0.1') return null;
      }
    } catch {
      // not a URL
    }

    // Direct relative path stored in DB, e.g. "/uploads/abc.png"
    if (imageUrl.startsWith('/uploads/')) {
      return imageUrl;
    }

    // Absolute URL from localhost that still points to local uploads
    try {
      const parsed = new URL(imageUrl);
      if (parsed.pathname.startsWith('/uploads/')) {
        return parsed.pathname;
      }
    } catch {
      // Not a valid URL; treat as non-local.
    }

    return null;
  }

  private async readImageBuffer(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      // On Vercel, /tmp is not shared between invocations — uploads from other requests
      // are not on this instance. Always download from the URL.
      const isVercel = process.env.VERCEL === '1';
      const localUploadsPath = isVercel ? null : this.resolveLocalUploadsPath(imageUrl);

      if (localUploadsPath) {
        const filepath = path.join(getUploadsRoot(), localUploadsPath.replace(/^\/uploads\/?/, ''));
        console.log('📁 Reading local file:', filepath);

        const buffer = fs.readFileSync(filepath);
        if (!buffer || buffer.length === 0) {
          throw new Error(`Local image file is empty (0 bytes): ${filepath}`);
        }
        const normalized = await this.normalizeImageToPng(buffer);
        return { buffer: normalized, mimeType: 'image/png' };
      }

      // Our S3 bucket URL: use credentialed GetObject (works with private bucket)
      if (this.s3Service.isEnabled && this.s3Service.isOurBucketUrl(imageUrl)) {
        const { body } = await this.s3Service.getObjectByUrl(imageUrl);
        const normalized = await this.normalizeImageToPng(body);
        return { buffer: normalized, mimeType: 'image/png' };
      }

      // Other remote URL - download via HTTP
      return new Promise((resolve, reject) => {
          const protocol = imageUrl.startsWith('https') ? https : http;
          const req = protocol.get(imageUrl, (response) => {
            if (!response.statusCode || response.statusCode >= 400) {
              const isVercel = process.env.VERCEL === '1';
              const isOwnUpload = imageUrl.includes('/uploads/');
              if (response.statusCode === 404 && isVercel && isOwnUpload) {
                reject(new BadRequestException(
                  'On Vercel, upload files are not available by URL (ephemeral storage). Send the user photo as base64 in the request body: set "userPhotoBase64" to a data URL (e.g. data:image/jpeg;base64,...) or raw base64 string.',
                ));
                return;
              }
              reject(new Error(`Failed to download image (${response.statusCode ?? 'unknown'}) from ${imageUrl}`));
              return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', async () => {
              const buffer = Buffer.concat(chunks);
              try {
                const normalized = await this.normalizeImageToPng(buffer);
                resolve({ buffer: normalized, mimeType: 'image/png' });
              } catch (e) {
                reject(e);
              }
            });
          });

          req.setTimeout(15_000, () => {
            req.destroy(new Error(`Timeout downloading image from ${imageUrl}`));
          });
          req.on('error', reject);
        });
    } catch (error) {
      console.error('❌ Error reading image buffer:', error);
      throw error;
    }
  }

  /**
   * Decode base64 (or data URL) to buffer and convert to File for OpenAI API.
   */
  private async base64ToFile(
    base64: string,
    filename: string,
    addPadding = false,
  ): Promise<{ file: any; width: number; height: number }> {
    let buffer: Buffer;

    if (base64.startsWith('data:')) {
      const match = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid data URL for user photo');
      buffer = Buffer.from(match[2], 'base64');
    } else {
      buffer = Buffer.from(base64, 'base64');
    }

    if (!buffer.length) throw new Error('Empty image data');
    const normalized = await this.normalizeImageToPng(buffer);
    return this.bufferToFile(normalized, 'image/png', filename, addPadding);
  }

  /**
   * Convert image buffer to File for OpenAI API (shared by URL and base64 paths).
   */
  private async bufferToFile(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    addPadding = false,
  ): Promise<{ file: any; width: number; height: number }> {
    let preparedBuffer = addPadding
      ? Buffer.from(await this.padImageToSafeFrame(buffer, 0.2))
      : buffer;

    let meta: sharp.Metadata;
    let effectiveMimeType = mimeType;
    try {
      meta = await sharp(preparedBuffer).metadata();
    } catch (err: any) {
      if (err?.message?.includes('unsupported') || err?.message?.includes('format')) {
        preparedBuffer = await this.normalizeImageToPng(preparedBuffer);
        meta = await sharp(preparedBuffer).metadata();
        effectiveMimeType = 'image/png';
      } else {
        throw err;
      }
    }
    if (!meta.width || !meta.height) {
      throw new Error('Invalid image dimensions');
    }

    const blob = new Blob([new Uint8Array(preparedBuffer)], { type: effectiveMimeType });
    // @ts-ignore - File constructor available in Node 18+
    const file = new File([blob], filename, { type: effectiveMimeType });

    return { file, width: meta.width, height: meta.height };
  }

  /**
   * Convert URL to File object for OpenAI API
   */
  private async urlToFile(
    imageUrl: string,
    filename: string,
    addPadding = false,
  ): Promise<{ file: any; width: number; height: number }> {
    const read = await this.readImageBuffer(imageUrl);
    return this.bufferToFile(read.buffer, read.mimeType, filename, addPadding);
  }

  /**
   * Build edit mask:
   * - Lock head/face area (opaque) for 1:1 likeness preservation.
   * - Allow body area (transparent) so pose can be adjusted to standing.
   */
  private async buildPoseEditMask(width: number, height: number): Promise<any> {
    const region = (x: number, y: number, w: number, h: number) => ({
      x: Math.round(width * x),
      y: Math.round(height * y),
      w: Math.round(width * w),
      h: Math.round(height * h),
    });

    const editable = [
      region(0.06, 0.20, 0.88, 0.76), // full body below head for standing pose adjustment
    ];

    const svgRects = editable
      .map(
        (r) =>
          `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="rgba(255,255,255,0)"/>`,
      )
      .join('');

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
<rect width="${width}" height="${height}" fill="rgba(0,0,0,1)"/>
${svgRects}
</svg>`;

    const maskBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const blob = new Blob([new Uint8Array(maskBuffer)], { type: 'image/png' });
    // @ts-ignore - File constructor available in Node 18+
    return new File([blob], 'edit-mask.png', { type: 'image/png' });
  }

  /**
   * Download image from URL and save to storage (S3 or local).
   */
  private async downloadAndSaveImage(imageUrl: string, filename: string): Promise<string> {
    const { buffer } = await this.readImageBuffer(imageUrl);
    const { url } = await this.uploadService.uploadBuffer(
      buffer,
      `generated/${filename}`,
      'image/png',
    );
    return url;
  }

  /**
   * Build a text-only outfit prompt for Puter.ai txt2img (no image references).
   */
  private buildOutfitTextPrompt(request: OutfitGenerationRequest): string {
    const isTop = (c: string) => ['top', 'tops', 'outerwear', 'jacket', 'jackets', 'coat', 'coats'].includes(c);
    const isBottom = (c: string) => ['bottom', 'bottoms', 'pants', 'jeans', 'trousers', 'shorts', 'skirt'].includes(c);
    const isShoes = (c: string) => ['shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'].includes(c);
    const parts: string[] = [];
    const top = request.clothingItems.find(item => isTop(item.category));
    const bottom = request.clothingItems.find(item => isBottom(item.category));
    const shoes = request.clothingItems.find(item => isShoes(item.category));
    if (top) parts.push('top');
    if (bottom) parts.push('bottom');
    if (shoes) parts.push('shoes');
    const outfitDesc = parts.length ? parts.join(', ') : 'outfit';
    const styleContext = typeof request.stylePrompt === 'string' ? request.stylePrompt.trim() : '';
    const style = styleContext ? ` Style: ${styleContext}.` : '';
    return `Full body standing photograph of a person wearing ${outfitDesc}. Professional lighting, plain background, photorealistic.${style}`.trim();
  }

  /**
   * Decode a data URL (e.g. from Puter.ai image.src) to a buffer.
   */
  private dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new BadRequestException('Invalid generatedImageDataUrl: expected data URL (data:...;base64,...)');
    const mimeType = match[1].trim();
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) throw new BadRequestException('Invalid generatedImageDataUrl: empty base64 data');
    return { buffer, mimeType };
  }

  /**
   * Generate outfit image using Puter.js (client-generated) or return prompt for client generation.
   * When generatedImageDataUrl is provided, server saves it and returns same response shape.
   * When not provided, returns { prompt, requireClientGeneration: true } for client to call Puter then re-POST with the image.
   */
  async generateOutfitImage(
    request: OutfitGenerationRequest,
  ): Promise<
    | { imageUrl: string; prompt: string; localPath: string }
    | { prompt: string; requireClientGeneration: true }
  > {
    const textPrompt = this.buildOutfitTextPrompt(request);

    // Puter flow: client already generated the image and sent it
    if (request.generatedImageDataUrl) {
      try {
        console.log('🎨 Saving client-generated outfit image (Puter.js)...');
        const { buffer } = this.dataUrlToBuffer(request.generatedImageDataUrl);
        const pngBuffer = await this.normalizeImageToPng(buffer);
        const filename = `outfit-${Date.now()}.png`;
        const { url } = await this.uploadService.uploadBuffer(
          pngBuffer,
          `generated/${filename}`,
          'image/png',
        );
        let finalPath = url;
        try {
          const cutout = await this.cutoutService.generateCutoutForImageUrl(url);
          if (cutout?.cutoutUrl) finalPath = cutout.cutoutUrl;
        } catch {
          // ignore
        }
        const fullPath = finalPath.startsWith('http')
          ? finalPath
          : `http://localhost:${this.configService.port ?? 3000}${finalPath}`;
        return { imageUrl: fullPath, localPath: fullPath, prompt: textPrompt };
      } catch (err: any) {
        console.error('Error saving client-generated outfit image:', err);
        throw err;
      }
    }

    // Return prompt so client can generate with Puter.ai.txt2img() then POST again with generatedImageDataUrl
    return { prompt: textPrompt, requireClientGeneration: true };
  }

  /**
   * @deprecated Legacy path: Generate outfit image using OpenAI gpt-image-1 (images.edit). Prefer Puter.js client flow.
   */
  async generateOutfitImageOpenAI(request: OutfitGenerationRequest): Promise<{ imageUrl: string; prompt: string; localPath: string }> {
    try {
      console.log('🎨 Starting Virtual Try-On with gpt-image-1...');
      console.log('📦 Received clothing items:', request.clothingItems.map(item => ({
        category: item.category,
        id: item.id,
        url: item.imageUrl
      })));

      // Get clothing items by category (support common UI labels and normalized enums)
      const isTop = (c: string) => ['top', 'tops', 'outerwear', 'jacket', 'jackets', 'coat', 'coats'].includes(c);
      const isBottom = (c: string) => ['bottom', 'bottoms', 'pants', 'jeans', 'trousers', 'shorts', 'skirt'].includes(c);
      const isShoes = (c: string) => ['shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'].includes(c);

      const topItem = request.clothingItems.find(item => isTop(item.category));
      const bottomItem = request.clothingItems.find(item => isBottom(item.category));
      const shoesItem = request.clothingItems.find(item => isShoes(item.category));

      // const weatherTemp = request.weather?.temperature ?? 22;
      // const weatherCondition = request.weather?.condition ?? 'clear';
      // const userSex = request.user?.sex;
      // const userAge = request.user?.age;
      // const userHeightCm = request.user?.heightCm;

      console.log('User photo URL:', request.userPhotoUrl);
      console.log('✅ Top item:', topItem ? topItem.imageUrl : '❌ NOT FOUND');
      console.log('✅ Bottom item:', bottomItem ? bottomItem.imageUrl : '❌ NOT FOUND');
      console.log('✅ Shoes item:', shoesItem ? shoesItem.imageUrl : '❌ NOT FOUND');

      if (!topItem && !bottomItem && !shoesItem) {
        throw new Error('No valid clothing items found. Please ensure items have correct categories: tops, bottoms, shoes');
      }

      // Convert ALL images to File objects for OpenAI
      // Prefer base64 user photo when provided (avoids 404 when URL points to same host on Vercel)
      const personPrepared = request.userPhotoBase64
        ? await this.base64ToFile(request.userPhotoBase64, 'person.png', true)
        : await this.urlToFile(request.userPhotoUrl, 'person.png', true);
      const editMask = await this.buildPoseEditMask(personPrepared.width, personPrepared.height);
      const imageFiles: any[] = [personPrepared.file];

      // Add clothing files if available (no padding needed for garments)
      if (topItem) {
        const topFile = await this.urlToFile(topItem.imageUrl, 'top.png', false);
        imageFiles.push(topFile.file);
      }
      if (bottomItem) {
        const bottomFile = await this.urlToFile(bottomItem.imageUrl, 'bottom.png', false);
        imageFiles.push(bottomFile.file);
      }
      if (shoesItem) {
        const shoesFile = await this.urlToFile(shoesItem.imageUrl, 'shoes.png', false);
        imageFiles.push(shoesFile.file);
      }

      console.log(`📸 Sending ${imageFiles.length} images to OpenAI (person + ${imageFiles.length - 1} clothing items)`);

      // Build the prompt with strict garment fidelity and image array references
      let imageIndex = 0;
      const personIndex = imageIndex++;
      const topIndex = topItem ? imageIndex++ : -1;
      const bottomIndex = bottomItem ? imageIndex++ : -1;
      const shoesIndex = shoesItem ? imageIndex++ : -1;

      const styleContext = typeof request.stylePrompt === 'string' ? request.stylePrompt.trim() : '';
      const prompt = `MODE: Virtual try-on. The user's profile image is ALWAYS the reference for the person. Produce ONE image: the same person standing full-body, wearing the given outfit. The user's face must stay 100% unchanged.

CRITICAL — PROFILE IMAGE AND FACE (DO NOT CHANGE):
- image[${personIndex}] is the user's profile/portrait photo. It is ALWAYS sent for every outfit generation.
- You MUST keep the user's face 100% identical: same eyes, nose, lips, jawline, skin tone, hair, expression. Zero alteration.
- Do NOT generate a new face. Do NOT beautify, smooth, reshape, or re-render the face or head. Do NOT change the person's identity.
- The output must be recognizably the EXACT SAME PERSON as in image[${personIndex}]. Only the body pose and clothing may change.

REQUIRED OUTPUT:
- One full-body standing photograph: the person from image[${personIndex}] standing from head to toe, neutral standing pose.
- Same face and identity as in image[${personIndex}]. The outfit is fitted on this same person using the garment reference images below.
- Framing: full body visible (head to feet), standing, as in a simple portrait photo. Do not crop the body.

SOURCE OF TRUTH FOR FACE:
- Face, head, hair, skin, neck must remain pixel-identical to image[${personIndex}]. Do not modify facial features or proportions in any way.
- Outside the editable (masked) region: keep pixels identical to image[${personIndex}]. No redraw, no enhance, no restyle of the face.

ONLY PERMITTED OPERATION:
- Inside the mask: replace the clothing area with the exact garments from these reference images:
${topIndex >= 0 ? `- image[${topIndex}] (top.png)` : ''}
${bottomIndex >= 0 ? `- image[${bottomIndex}] (bottom.png)` : ''}
${shoesIndex >= 0 ? `- image[${shoesIndex}] (shoes.png)` : ''}
- Use the exact appearance, color, material, and cut of each garment. Do not redesign or stylize. The outfit should fit the person naturally.

PROHIBITED:
- Do NOT change or replace the user's face in any way.
- Do NOT generate a different person or a different face.
- Do NOT smooth skin, slim body, or reshape the face.
- Do NOT change camera framing, zoom, or crop away the full body.

OUTPUT: Same person (face 100% from image[${personIndex}]), full-body standing pose, wearing the specified garments. PNG.

${styleContext ? `STYLE CONTEXT (secondary): ${styleContext}` : ''}
`.trim();

      console.log('📤 Calling OpenAI images.edit with gpt-image-1...');
      console.log('📋 Prompt:', prompt);

      // Use images.edit API with multiple images (gpt-image-1 supports up to 16 images)
      // images[0] = person (identity anchor)
      // images[1+] = clothing items
      const response = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFiles, // Array of File objects
        mask: editMask,
        prompt: prompt,
        size: '1024x1536', // Portrait for full-body (not square to prevent cropping)
        n: 1,
      });

      console.log('OpenAI Response received');

      // Handle both URL and base64 responses
      const imageUrl = response.data?.[0]?.url;
      const imageB64 = response.data?.[0]?.b64_json;

      if (!imageUrl && !imageB64) {
        console.error('No image URL or base64 in response. Full response:', JSON.stringify(response, null, 2));
        throw new Error('Failed to generate image - no URL or base64 in OpenAI response');
      }

      const filename = `outfit-${Date.now()}.png`;
      let localPath: string = '';

      if (imageB64) {
        console.log('Image received as base64, saving to storage...');
        const buffer = Buffer.from(imageB64, 'base64');
        const { url } = await this.uploadService.uploadBuffer(
          buffer,
          `generated/${filename}`,
          'image/png',
        );
        localPath = url;
        console.log('Image saved at:', localPath);
      } else if (imageUrl) {
        console.log('Image generated, downloading from URL...');
        localPath = await this.downloadAndSaveImage(imageUrl, filename);
        console.log('Image saved at:', localPath);
      }

      // Prefer a transparent PNG cutout so the output is "standing user only".
      // Best-effort: if cutout fails, fall back to generated PNG.
      let finalPath = localPath;
      try {
        const cutout = await this.cutoutService.generateCutoutForImageUrl(localPath);
        if (cutout?.cutoutUrl) {
          finalPath = cutout.cutoutUrl;
          console.log('✅ Generated transparent cutout:', finalPath);
        }
      } catch (e) {
        console.warn('Cutout post-process failed, using original generated PNG.');
      }

      // Ensure we return a full URL for frontend (S3 URL or localhost)
      const fullLocalPath = finalPath.startsWith('http')
        ? finalPath
        : `http://localhost:${this.configService.port ?? 3000}${finalPath}`;

      console.log('✅ Generated outfit image at:', fullLocalPath);

      return {
        imageUrl: fullLocalPath, // Always return localhost URL
        localPath: fullLocalPath, // Same URL for consistency
        prompt: prompt,
      };
    } catch (error: any) {
      if (error?.code === 'invalid_api_key' || error?.status === 401) {
        console.error(
          '[OpenAI] 401 / invalid_api_key — check OPENAI_API_KEY in Vercel env vars and at https://platform.openai.com/api-keys',
          error?.message ?? error,
        );
        throw new UnauthorizedException(
          'OpenAI API key is invalid or expired. Update OPENAI_API_KEY in Vercel (Settings → Environment Variables) or in .env. Get a key at https://platform.openai.com/api-keys',
        );
      }
      console.error('Error generating outfit image:', error);
      throw error;
    }
  }

  /**
   * Alternative: Use image editing API to composite outfit onto user photo
   * This provides better identity preservation
   */
  async generateOutfitComposite(request: OutfitGenerationRequest): Promise<{ imageUrl: string }> {
    try {
      // This would use DALL-E image editing API
      // The user's photo is used as the base
      // The clothing items are described in the prompt

      const clothingDescriptions = request.clothingItems
        .map(item => `${item.category}`)
        .join(', ');

      const weatherContext = request.weather
        ? `Weather: ${request.weather.condition}, ${request.weather.temperature}°C. `
        : '';

      const finalPrompt = `Full body fashion photograph of a person wearing ${clothingDescriptions}. ${weatherContext}Professional studio lighting, realistic fabric drape and shadows, plain white background, high fashion editorial style, photorealistic, 4K quality.`;

      // Note: In production, you'd need to:
      // 1. Download the user's photo
      // 2. Process it to PNG with transparency
      // 3. Use the edit endpoint with proper masking

      // For now, we'll use the generate endpoint with GPT-Image-1.5
      const response = await this.openai.images.generate({
        model: 'gpt-image-1.5',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1536', // Portrait format for full body
        quality: 'high', // Highest quality for better face preservation
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }

      return { imageUrl };
    } catch (error: any) {
      if (error?.code === 'invalid_api_key' || error?.status === 401) {
        throw new UnauthorizedException(
          'OpenAI API key is invalid or expired. Update OPENAI_API_KEY in Vercel (Settings → Environment Variables) or in .env. Get a key at https://platform.openai.com/api-keys',
        );
      }
      console.error('Error generating outfit composite:', error);
      throw error;
    }
  }

  /**
   * Analyze wardrobe completeness based on weather conditions
   */
  async analyzeWardrobe(dto: AnalyzeWardrobeDto): Promise<WardrobeAnalysisResult> {
    const { items, weather } = dto;
    const missingItems: string[] = [];
    const recommendations: string[] = [];

    // Count items by category
    const categoryCounts = items.reduce((acc, item) => {
      const category = item.category.toLowerCase();
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hasJackets = (categoryCounts['jackets'] || 0) > 0 || (categoryCounts['jacket'] || 0) > 0;
    const hasTops = (categoryCounts['tops'] || 0) > 0 || (categoryCounts['top'] || 0) > 0;
    const hasBottoms = (categoryCounts['bottoms'] || 0) > 0 || (categoryCounts['bottom'] || 0) > 0;
    const hasShoes = (categoryCounts['shoes'] || 0) > 0 || (categoryCounts['shoe'] || 0) > 0;

    // Weather-based validation
    if (weather.temperature < 10) {
      if (!hasJackets) {
        missingItems.push('jacket');
        recommendations.push(
          `It's ${weather.temperature}°C outside. You'll need a warm jacket or coat for cold weather.`
        );
      }
    }

    if (weather.temperature < 0) {
      recommendations.push(
        'Freezing temperatures detected. Consider adding winter accessories like scarves, gloves, and thermal layers.'
      );
    }

    if (weather.temperature > 25) {
      recommendations.push(
        `Hot weather (${weather.temperature}°C). Light, breathable fabrics are recommended.`
      );
    }

    if (weather.condition.toLowerCase().includes('rain')) {
      recommendations.push(
        'Rainy conditions detected. A waterproof jacket or raincoat would be ideal.'
      );
    }

    if (weather.condition.toLowerCase().includes('snow')) {
      if (!hasJackets) {
        missingItems.push('winter jacket');
      }
      recommendations.push(
        'Snowy weather requires insulated outerwear and waterproof boots.'
      );
    }

    // Basic wardrobe validation
    if (!hasTops) {
      missingItems.push('tops');
      recommendations.push('Add at least one top (shirt, t-shirt, or blouse).');
    }

    if (!hasBottoms) {
      missingItems.push('bottoms');
      recommendations.push('Add at least one bottom (pants, jeans, or skirt).');
    }

    if (!hasShoes) {
      missingItems.push('shoes');
      recommendations.push('Add at least one pair of shoes.');
    }

    return {
      isComplete: missingItems.length === 0,
      missingItems,
      recommendations: recommendations.length > 0
        ? recommendations
        : [`Your wardrobe looks great for ${weather.temperature}°C weather!`],
    };
  }
}

