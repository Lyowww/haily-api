import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getUploadsRoot, getUploadsSubdir, ensureUploadsDir } from '../utils/uploads-path';

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

  /**
   * Generate a transparent PNG cutout for an uploaded image and store it under /uploads/cutouts.
   * Accepts either a relative "/uploads/..." URL or a full URL that contains "/uploads/...".
   * On Vercel (where @imgly/background-removal-node is excluded), returns null and cutout is skipped.
   */
  async generateCutoutForImageUrl(imageUrl: string): Promise<
    | {
        cutoutUrl: string; // relative "/uploads/cutouts/....png"
      }
    | null
  > {
    const uploadsPathname = this.extractUploadsPathname(imageUrl);
    if (!uploadsPathname) return null;

    const inputAbsPath = path.join(getUploadsRoot(), uploadsPathname.replace(/^\/uploads\/?/, ''));

    try {
      const inputBuffer = await fs.readFile(inputAbsPath);

      let removeBackground: (input: Buffer) => Promise<Blob>;
      try {
        removeBackground = await loadRemoveBackground();
      } catch (e) {
        this.logger.warn(
          'Background removal not available (e.g. excluded on Vercel). Skipping cutout.',
        );
        return null;
      }

      // Background removal returns a PNG-encoded Blob by default.
      const blob = await removeBackground(inputBuffer);
      const pngBuffer = Buffer.from(await blob.arrayBuffer());

      const cutoutsDirAbs = getUploadsSubdir('cutouts');
      ensureUploadsDir(cutoutsDirAbs);

      const filename = `${uuidv4()}.png`;
      const outputAbsPath = path.join(cutoutsDirAbs, filename);

      // Normalize sizing so overlays render fast on mobile.
      await sharp(pngBuffer)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(outputAbsPath);

      return { cutoutUrl: `/uploads/cutouts/${filename}` };
    } catch (err: any) {
      this.logger.warn(`Cutout generation failed for ${uploadsPathname}: ${err?.message || err}`);
      return null;
    }
  }

  private extractUploadsPathname(input: string): string | null {
    if (!input) return null;

    // Already a relative /uploads/... URL.
    if (input.startsWith('/uploads/')) return input;

    // Full URL: take pathname.
    try {
      const url = new URL(input);
      if (url.pathname.startsWith('/uploads/')) return url.pathname;
    } catch {
      // ignore
    }

    // Fallback: search for "/uploads/" substring.
    const idx = input.indexOf('/uploads/');
    if (idx >= 0) return input.slice(idx);

    return null;
  }
}

