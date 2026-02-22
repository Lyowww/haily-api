import * as path from 'path';

/**
 * Root directory for uploads. On Vercel the project FS is read-only, so we use /tmp.
 */
export function getUploadsRoot(): string {
  return process.env.VERCEL === '1'
    ? path.join('/tmp', 'uploads')
    : path.join(process.cwd(), 'uploads');
}

export function getUploadsSubdir(subdir: string): string {
  const root = getUploadsRoot();
  return path.join(root, subdir);
}

/** Ensure directory exists; no-op on read-only FS (mkdir may throw). */
export function ensureUploadsDir(dir: string): void {
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore on read-only FS (e.g. serverless)
    }
  }
}
