import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config';
import OpenAI from 'openai';
import { AnalyzeWardrobeDto } from './dto/analyze-wardrobe.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import sharp from 'sharp';
import { CutoutService } from '../cutout/cutout.service';
import { UploadService } from '../upload/upload.service';
import { getUploadsRoot } from '../utils/uploads-path';

interface OutfitGenerationRequest {
  userPhotoUrl: string;
  /** Optional base64 image data. Use when URL is not reachable (e.g. same-host on Vercel). */
  userPhotoBase64?: string;
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

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private cutoutService: CutoutService,
    private uploadService: UploadService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.openAiApiKey,
    });
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
        const mimeType = filepath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return { buffer, mimeType };
      } else {
        // Remote URL - download it first
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
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const mimeType = response.headers['content-type'] || 'image/jpeg';
              resolve({ buffer, mimeType });
            });
          });

          req.setTimeout(15_000, () => {
            req.destroy(new Error(`Timeout downloading image from ${imageUrl}`));
          });
          req.on('error', reject);
        });
      }
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
    let mimeType = 'image/jpeg';

    if (base64.startsWith('data:')) {
      const match = base64.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid data URL for user photo');
      mimeType = match[1].trim().toLowerCase();
      if (!mimeType.startsWith('image/')) mimeType = 'image/jpeg';
      buffer = Buffer.from(match[2], 'base64');
    } else {
      buffer = Buffer.from(base64, 'base64');
    }

    if (!buffer.length) throw new Error('Empty image data');
    return this.bufferToFile(buffer, mimeType, filename, addPadding);
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
    const preparedBuffer = addPadding
      ? Buffer.from(await this.padImageToSafeFrame(buffer, 0.2))
      : buffer;

    const meta = await sharp(preparedBuffer).metadata();
    if (!meta.width || !meta.height) {
      throw new Error('Invalid image dimensions');
    }

    const blob = new Blob([new Uint8Array(preparedBuffer)], { type: mimeType });
    // @ts-ignore - File constructor available in Node 18+
    const file = new File([blob], filename, { type: mimeType });

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
   * Generate outfit image using DALL-E 3
   */
  async generateOutfitImage(request: OutfitGenerationRequest): Promise<{ imageUrl: string; prompt: string; localPath: string }> {
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
      const prompt = `MODE: Constrained inpainting.
This is NOT generation.
This is NOT recreation.
This is NOT reinterpretation.

SOURCE OF TRUTH:
image[${personIndex}] (person.png) is the immutable base image.

HARD CONSTRAINT:
All pixels outside the transparent clothing mask MUST remain 100% identical to image[${personIndex}].
Zero modification allowed outside mask.
Do not redraw.
Do not regenerate.
Do not enhance.
Do not beautify.
Do not restyle.

IDENTITY FREEZE (NON-NEGOTIABLE):
The following must remain pixel-identical to the source image:
- Face (all facial features)
- Head shape
- Hair (shape, volume, color)
- Skin tone and texture
- Neck
- Hands
- Arms
- Legs
- Body proportions
- Silhouette outline

Do NOT modify:
- Jawline
- Cheeks
- Nose
- Eyes
- Lips
- Body width
- Shoulder width
- Waist width
- Hip width
- Limb thickness
- Height proportions

NO GEOMETRY CHANGES:
Do not change pose geometry.
Do not re-pose skeleton.
Do not re-estimate anatomy.
The body structure must remain identical to source.

ONLY PERMITTED OPERATION:
Replace pixels inside the clothing mask region with the exact garments from reference images:

${topIndex >= 0 ? `- image[${topIndex}] (top.png)` : ''}
${bottomIndex >= 0 ? `- image[${bottomIndex}] (bottom.png)` : ''}
${shoesIndex >= 0 ? `- image[${shoesIndex}] (shoes.png)` : ''}

GARMENT RULES:
- Use exact garment appearance.
- Preserve color exactly.
- Preserve material and texture exactly.
- Preserve cut and length exactly.
- Do not redesign or reinterpret.
- Do not stylize.

PROHIBITED:
- Do NOT generate a new person.
- Do NOT adjust lighting on skin.
- Do NOT smooth skin.
- Do NOT slim body.
- Do NOT reshape face.
- Do NOT re-render head.
- Do NOT adjust camera framing.
- Do NOT zoom.
- Do NOT crop.

OUTPUT:
- Same person
- Same proportions
- Same framing
- Only clothing replaced inside mask
- PNG output

${styleContext ? `STYLE CONTEXT (FOLLOW AS A SECONDARY CONSTRAINT):\n${styleContext}\nOnly apply style choices that are compatible with exact garment fidelity and identity freeze rules.` : ''}
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

