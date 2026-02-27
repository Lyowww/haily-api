import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '../config';

@Injectable()
export class FirebasePushService {
  private readonly logger = new Logger(FirebasePushService.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {}

  private get isConfiguredInternally(): boolean {
    return this.config.isFirebaseConfigured;
  }

  get isConfigured(): boolean {
    return this.isConfiguredInternally;
  }

  private initIfNeeded(): void {
    if (this.initialized || !this.isConfiguredInternally) return;

    try {
      const projectId = this.config.firebaseProjectId!;
      const clientEmail = this.config.firebaseClientEmail!;
      const privateKey = this.config.firebasePrivateKey!;

      const existingApp = admin.apps[0];
      if (!existingApp) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }

      this.initialized = true;
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err as any);
      this.initialized = false;
    }
  }

  async sendToToken(
    token: string,
    message: { title: string; body: string; data?: Record<string, any> },
  ): Promise<boolean> {
    if (!this.isConfiguredInternally) return false;

    this.initIfNeeded();
    if (!this.initialized) return false;

    try {
      const data: Record<string, string> = {};
      if (message.data) {
        for (const [key, value] of Object.entries(message.data)) {
          data[key] = String(value);
        }
      }

      await admin.messaging().send({
        token,
        notification: {
          title: message.title,
          body: message.body,
        },
        data,
      });

      return true;
    } catch (err: any) {
      const code = err?.code as string | undefined;
      this.logger.warn(`Failed to send FCM push: ${code ?? 'unknown_error'}`, err);
      return false;
    }
  }
}

