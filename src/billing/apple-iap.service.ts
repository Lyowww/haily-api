import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config';
import { APPLE_PRODUCT_TO_PLAN } from './billing.constants';

/**
 * Result of a valid Apple IAP subscription (or auto-renewable) from receipt validation.
 * Used to update the user's subscription and purchase records.
 */
export interface AppleReceiptSubscription {
  /** Apple product ID (e.g. com.yourapp.pro.monthly). */
  productId: string;
  /** Plan name resolved from productId (e.g. pro). */
  plan: string;
  /** Original transaction ID — stable across renewals; use as externalId for Purchase. */
  originalTransactionId: string;
  /** Transaction ID of this specific renewal. */
  transactionId: string;
  /** Purchase date (ms since epoch). */
  purchaseDate: number;
  /** Expiration date (ms since epoch); undefined for non-expiring. */
  expirationDate?: number;
  /** Whether the subscription is currently active (now < expirationDate). */
  isActive: boolean;
}

// node-apple-receipt-verify is CommonJS; use require for compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appleReceiptVerify = require('node-apple-receipt-verify') as {
  config: (opts: Record<string, unknown>) => void;
  validate: (opts: { receipt: string; environment?: string[] }, cb: (err: Error | null, products: Array<{ productId: string; transactionId: string; originalTransactionId?: string; purchaseDate: number; expirationDate?: number; bundleId?: string }>) => void) => void;
};

@Injectable()
export class AppleIapService {
  private readonly logger = new Logger(AppleIapService.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {
    if (this.config.isAppleIapConfigured) {
      this.configure();
      this.configured = true;
    }
  }

  /**
   * Configure the node-apple-receipt-verify module.
   * Uses sandbox first when APPLE_IAP_SANDBOX is true (default), then production.
   */
  private configure(): void {
    const secret = this.config.appleIapSharedSecret!;
    const environment = this.config.appleIapSandbox ? ['sandbox', 'production'] : ['production'];
    appleReceiptVerify.config({
      secret,
      environment,
      extended: true,
      ignoreExpired: false, // We need expired info to know period end
      verbose: this.config.isDevelopment,
    });
  }

  /**
   * Validate an Apple IAP receipt (base64) with Apple's servers.
   * Returns the best active subscription found (latest expiration), or the latest expired one for period tracking.
   *
   * @param receiptData - Base64-encoded receipt from the client (StoreKit 1) or from the app's receipt URL.
   * @returns Parsed subscription info for the highest-tier active subscription, or null if invalid/no subscription.
   */
  async validateReceipt(receiptData: string): Promise<AppleReceiptSubscription | null> {
    if (!this.config.isAppleIapConfigured || !this.configured) {
      this.logger.warn('Apple IAP not configured; skipping receipt validation.');
      return null;
    }

    const bundleId = this.config.appleIapBundleId;
    if (!bundleId) {
      this.logger.warn('APPLE_IAP_BUNDLE_ID not set.');
      return null;
    }

    return new Promise((resolve) => {
      appleReceiptVerify.validate(
        {
          receipt: receiptData,
          environment: this.config.appleIapSandbox ? ['sandbox', 'production'] : ['production'],
        },
        (err: Error | null, products: Array<{ productId: string; transactionId: string; originalTransactionId?: string; purchaseDate: number; expirationDate?: number; bundleId?: string }>) => {
          if (err) {
            this.logger.warn(`Apple receipt validation failed: ${err.message}`);
            resolve(null);
            return;
          }
          if (!Array.isArray(products) || products.length === 0) {
            this.logger.debug('Apple receipt has no (valid) in-app purchases.');
            resolve(null);
            return;
          }

          const now = Date.now();
          const bundleFilter = (p: { bundleId?: string }) => !bundleId || p.bundleId === bundleId;
          const subs = products.filter(
            (p) => p.productId && p.expirationDate != null && bundleFilter(p),
          );

          if (subs.length === 0) {
            const first = products.find((p) => p.productId && bundleFilter(p));
            if (first?.productId) {
              const plan = APPLE_PRODUCT_TO_PLAN[first.productId] ?? 'pro';
              resolve({
                productId: first.productId,
                plan,
                originalTransactionId: first.originalTransactionId ?? first.transactionId ?? '',
                transactionId: first.transactionId ?? '',
                purchaseDate: first.purchaseDate ?? 0,
                expirationDate: first.expirationDate,
                isActive: first.expirationDate ? first.expirationDate > now : true,
              });
              return;
            }
            resolve(null);
            return;
          }

          subs.sort((a, b) => {
            const aExp = a.expirationDate ?? 0;
            const bExp = b.expirationDate ?? 0;
            const aActive = aExp > now ? 1 : 0;
            const bActive = bExp > now ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;
            return bExp - aExp;
          });

          const best = subs[0];
          const plan = APPLE_PRODUCT_TO_PLAN[best.productId] ?? 'pro';
          const expirationDate = best.expirationDate;
          const isActive = expirationDate != null ? expirationDate > now : true;

          resolve({
            productId: best.productId,
            plan,
            originalTransactionId: best.originalTransactionId ?? best.transactionId ?? '',
            transactionId: best.transactionId ?? '',
            purchaseDate: best.purchaseDate ?? 0,
            expirationDate,
            isActive,
          });
        },
      );
    });
  }

  /**
   * Resolve plan name from Apple product ID using APPLE_PRODUCT_TO_PLAN.
   */
  productIdToPlan(productId: string): string {
    return APPLE_PRODUCT_TO_PLAN[productId] ?? 'pro';
  }
}
