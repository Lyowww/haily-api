import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '../config';

/**
 * S3 operations for uploads. Used when S3 is configured (e.g. on Vercel).
 * Builds public object URLs in the form https://<bucket>.s3.<region>.amazonaws.com/<key>.
 * Use getObject/getObjectByUrl to read objects with credentials (bucket can stay private).
 */
@Injectable()
export class S3Service {
  private readonly client: S3Client | null = null;
  private readonly bucket: string = '';
  private readonly region: string = '';

  constructor(private config: ConfigService) {
    if (!this.config.isS3Configured) return;

    const endpoint = this.config.s3Endpoint!;
    this.bucket = this.config.s3Bucket!;
    this.region = this.config.s3Region;

    this.client = new S3Client({
      region: this.region,
      endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId: this.config.s3AccessKey!,
        secretAccessKey: this.config.s3SecretKey!,
      },
    });
  }

  get isEnabled(): boolean {
    return this.config.isS3Configured && this.client !== null;
  }

  /** True if url is our bucket's object URL (same bucket + region). */
  isOurBucketUrl(url: string): boolean {
    if (!this.bucket || !this.region) return false;
    try {
      const u = new URL(url);
      const expectedHost = `${this.bucket}.s3.${this.region}.amazonaws.com`;
      return u.protocol === 'https:' && u.hostname === expectedHost && u.pathname.startsWith('/');
    } catch {
      return false;
    }
  }

  /**
   * Extract S3 object key from our bucket object URL.
   * e.g. https://hayli-uploads.s3.eu-north-1.amazonaws.com/uploads/abc.jpg -> uploads/abc.jpg
   */
  keyFromOurBucketUrl(url: string): string | null {
    if (!this.isOurBucketUrl(url)) return null;
    try {
      const pathname = new URL(url).pathname;
      return pathname.replace(/^\//, '') || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch object from S3 using credentials (works for private buckets).
   */
  async getObject(key: string): Promise<{ body: Buffer; contentType?: string }> {
    if (!this.client) throw new Error('S3 is not configured');

    const keyNorm = key.replace(/^\//, '');
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: keyNorm,
      }),
    );

    if (!res.Body) throw new Error(`S3 GetObject returned no body for key: ${keyNorm}`);

    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as any) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const contentType = res.ContentType ?? undefined;
    return { body, contentType };
  }

  /**
   * Fetch object by our bucket URL using credentials (for private buckets).
   */
  async getObjectByUrl(url: string): Promise<{ body: Buffer; contentType?: string }> {
    const key = this.keyFromOurBucketUrl(url);
    if (key == null) throw new Error(`URL is not our S3 object URL: ${url}`);
    return this.getObject(key);
  }

  /**
   * Upload a buffer to S3 and return the public URL.
   * @param key Object key (e.g. "uploads/abc.jpg", "uploads/generated/outfit.png")
   */
  async putObject(key: string, body: Buffer, contentType?: string): Promise<string> {
    if (!this.client) throw new Error('S3 is not configured');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType ?? 'application/octet-stream',
      }),
    );

    return this.getPublicUrl(key);
  }

  /**
   * Public URL for an object (only works if bucket allows public GetObject).
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key.replace(/^\//, '')}`;
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.client) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key.replace(/^\//, ''),
      }),
    );
  }
}
