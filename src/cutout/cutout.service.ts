import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getUploadsRoot } from '../utils/uploads-path';
import { UploadService } from '../upload/upload.service';

/**
 * Cutout (background removal) uses @imgly/background-removal-node, which is very large (~200MB+).
 * On Vercel we exclude it via .vercelignore to stay under the 250MB serverless limit.
 * We dynamic-import it only when needed; if missing, cutout is skipped and we return null.
 */
async function loadRemoveBackground(): Promise<(input: Buffer) => Promise<Blob>> {
  const mod = await import('@imgly/background-removal-node');
  return mod.removeBackground;
}

@Injectable()
export class CutoutService {
  private readonly logger = new Logger(CutoutService.name);

  constructor(private uploadService: UploadService) {}

  /**
   * Generate a transparent PNG cutout for an uploaded image and store under uploads/cutouts (S3 or local).
   * Accepts relative "/uploads/..." path, or full URL (e.g. S3). On Vercel, pass S3 URLs.
   */
  async generateCutoutForImageUrl(imageUrl: string): Promise<
    | {
        cutoutUrl: string;
      }
    | null
  > {
    let inputBuffer: Buffer;

    try {
      inputBuffer = await this.getImageBuffer(imageUrl);
    } catch (e) {
      this.logger.warn(`Could not load image for cutout: ${(e as Error)?.message}`);
      return null;
    }

    if (!inputBuffer || inputBuffer.length === 0) return null;

    try {
      let removeBackground: (input: Buffer) => Promise<Blob>;
      try {
        removeBackground = await loadRemoveBackground();
      } catch (e) {
        this.logger.warn(
          'Background removal not available (e.g. excluded on Vercel). Skipping cutout.',
        );
        return null;
      }

      const blob = await removeBackground(inputBuffer);
      const pngBuffer = Buffer.from(await blob.arrayBuffer());

      const resizedBuffer = await sharp(pngBuffer)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();

      const filename = `${uuidv4()}.png`;
      const { url } = await this.uploadService.uploadBuffer(
        resizedBuffer,
        `cutouts/${filename}`,
        'image/png',
      );

      return { cutoutUrl: url };
    } catch (err: any) {
      this.logger.warn(`Cutout generation failed for ${imageUrl}: ${err?.message || err}`);
      return null;
    }
  }

  /** Resolve image URL to buffer: local /uploads/ path or download from HTTP(S). */
  private async getImageBuffer(imageUrl: string): Promise<Buffer> {
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Missing image URL');
    }

    const localPath = this.getLocalUploadsPath(imageUrl);
    if (localPath) {
      const inputAbsPath = path.join(getUploadsRoot(), localPath.replace(/^\/uploads\/?/, ''));
      try {
        return await fs.readFile(inputAbsPath);
      } catch {
        // Fall through to URL download if file not found (e.g. Vercel, no local file)
      }
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return await this.downloadUrl(imageUrl);
    }

    throw new Error('Could not resolve image: not a local path or URL');
  }

  private getLocalUploadsPath(input: string): string | null {
    if (input.startsWith('/uploads/')) return input;
    try {
      const url = new URL(input);
      if (url.pathname.startsWith('/uploads/')) return url.pathname;
    } catch {
      // ignore
    }
    const idx = input.indexOf('/uploads/');
    return idx >= 0 ? input.slice(idx) : null;
  }

  private downloadUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.get(url, (response) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode} from ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.setTimeout(30_000, () => {
        req.destroy(new Error('Timeout'));
      });
      req.on('error', reject);
    });
  }
}
