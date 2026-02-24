import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '../config';

/**
 * S3 operations for uploads. Used when S3 is configured (e.g. on Vercel).
 * Builds public object URLs in the form https://<bucket>.s3.<region>.amazonaws.com/<key>.
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
   * Public URL for an object (bucket must allow GetObject for this to work).
   */
  getPublicUrl(key: string): string {
    // Standard format: https://<bucket>.s3.<region>.amazonaws.com/<key>
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
