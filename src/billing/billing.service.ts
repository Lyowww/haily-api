import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '../config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { PLAN_LIMITS, PRICE_TO_PLAN, APPLE_PRODUCT_TO_PLAN } from './billing.constants';
import { AppleIapService, AppleReceiptSubscription } from './apple-iap.service';

export interface SubscriptionStatus {
  plan: string;
  status: string;
  /** Source of the subscription: "ios" (Apple IAP) or "android" / "web" (Stripe). */
  platform: string | null;
  /** Billing period start date (YYYY-MM-DD). */
  currentPeriodStart: string | null;
  /** Billing period end date (YYYY-MM-DD); access until this date when active. */
  currentPeriodEnd: string | null;
  /** True if subscription is set to cancel at period end (no renewal). */
  cancelAtPeriodEnd: boolean;
  limits: {
    aiRemaining: number;
    virtualRemaining: number;
    weeklyRemaining: number;
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private appleIap: AppleIapService,
  ) {
    if (this.config.isStripeConfigured) {
      this.stripe = new Stripe(this.config.stripeSecretKey!);
    }
  }

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Billing is not configured.');
    }
    return this.stripe;
  }

  /** Get current month string YYYY-MM. */
  private currentMonth(): string {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  /** Get or create usage record for user for current month. */
  async getOrCreateUsage(userId: string) {
    const month = this.currentMonth();
    return this.prisma.usage.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month },
      update: {},
    });
  }

  /** Increment AI generations count. Call after successful AI generation. */
  async incrementAiGenerations(userId: string): Promise<void> {
    const month = this.currentMonth();
    await this.prisma.usage.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, aiGenerationsCount: 1 },
      update: { aiGenerationsCount: { increment: 1 } },
    });
  }

  /** Increment virtual try-on count. Call after successful virtual try-on. */
  async incrementVirtualTryon(userId: string): Promise<void> {
    const month = this.currentMonth();
    await this.prisma.usage.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, virtualTryonCount: 1 },
      update: { virtualTryonCount: { increment: 1 } },
    });
  }

  /** Increment weekly generation count. Call after successful weekly generate. */
  async incrementWeeklyGenerations(userId: string): Promise<void> {
    const month = this.currentMonth();
    await this.prisma.usage.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, weeklyGenerationCount: 1 },
      update: { weeklyGenerationCount: { increment: 1 } },
    });
  }

  /** Get plan limits; -1 means unlimited. */
  getPlanLimits(plan: string): { ai: number; virtualTryOn: number; weekly: number } {
    return PLAN_LIMITS[plan] ?? { ai: 0, virtualTryOn: 0, weekly: 0 };
  }

  /** Resolve plan from Stripe price ID. */
  private planFromPriceId(priceId: string): string {
    return PRICE_TO_PLAN[priceId] ?? 'pro';
  }

  /** Trial duration in months for new users. */
  private static readonly PRO_TRIAL_MONTHS = 3;

  /**
   * Create a 3-month Pro free trial for a user (e.g. on registration).
   * No Stripe; subscription is active until currentPeriodEnd.
   */
  async createProTrial(userId: string): Promise<void> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + BillingService.PRO_TRIAL_MONTHS);
    await this.prisma.subscription.create({
      data: {
        userId,
        plan: 'pro',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  /**
   * Check if user has active subscription and usage within limits.
   * Throws if subscription required or limit exceeded.
   */
  async assertCanUseAi(userId: string): Promise<void> {
    const status = await this.getSubscriptionStatus(userId);
    if (status.status !== 'active') {
      throw new BadRequestException('Subscription required');
    }
    if (status.limits.aiRemaining === 0) {
      throw new BadRequestException('AI generation limit reached for this month');
    }
  }

  async assertCanUseVirtualTryon(userId: string): Promise<void> {
    const status = await this.getSubscriptionStatus(userId);
    if (status.status !== 'active') {
      throw new BadRequestException('Subscription required');
    }
    if (status.limits.virtualRemaining === 0) {
      throw new BadRequestException('Virtual try-on limit reached for this month');
    }
  }

  async assertCanUseWeeklyGenerate(userId: string): Promise<void> {
    const status = await this.getSubscriptionStatus(userId);
    if (status.status !== 'active') {
      throw new BadRequestException('Subscription required');
    }
    if (status.limits.weeklyRemaining === 0) {
      throw new BadRequestException('Weekly generation limit reached for this month');
    }
  }

  /** Get subscription status and remaining limits for the user. */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const plan = subscription?.plan ?? 'starter';
    const limits = this.getPlanLimits(plan);
    let isActive = subscription?.status === 'active'; // still active when cancel_at_period_end until period end

    // Trial/period-based: if currentPeriodEnd is in the past, treat as expired
    if (subscription?.currentPeriodEnd && new Date() > subscription.currentPeriodEnd && isActive) {
      await this.prisma.subscription.update({
        where: { userId },
        data: { status: 'expired' },
      });
      subscription = { ...subscription, status: 'expired' };
      isActive = false;
    }

    if (!subscription || !isActive) {
      return {
        plan: 'starter',
        status: subscription?.status ?? 'inactive',
        platform: subscription?.platform ?? null,
        currentPeriodStart: subscription?.currentPeriodStart?.toISOString().slice(0, 10) ?? null,
        currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString().slice(0, 10) ?? null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        limits: {
          aiRemaining: 0,
          virtualRemaining: 0,
          weeklyRemaining: 0,
        },
      };
    }

    const usage = await this.getOrCreateUsage(userId);
    const aiRemaining =
      limits.ai < 0 ? 999999 : Math.max(0, limits.ai - usage.aiGenerationsCount);
    const virtualRemaining =
      limits.virtualTryOn < 0 ? 999999 : Math.max(0, limits.virtualTryOn - usage.virtualTryonCount);
    const weeklyRemaining =
      limits.weekly < 0 ? 999999 : Math.max(0, limits.weekly - usage.weeklyGenerationCount);

    return {
      plan: subscription.plan,
      status: subscription.status,
      platform: subscription.platform ?? null,
      currentPeriodStart: subscription.currentPeriodStart?.toISOString().slice(0, 10) ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString().slice(0, 10) ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      limits: {
        aiRemaining,
        virtualRemaining,
        weeklyRemaining,
      },
    };
  }

  /**
   * Verify a purchase and update subscription + purchase record.
   * - iOS: pass receiptData (base64); we validate with Apple and upsert subscription.
   * - Android/web: pass sessionId (Stripe checkout session); we sync from Stripe.
   */
  async verifyPurchase(
    userId: string,
    platform: 'ios' | 'android' | 'web',
    payload: { receiptData?: string; sessionId?: string },
  ): Promise<{ ok: boolean; plan?: string; message?: string }> {
    if (platform === 'ios') {
      const receiptData = payload.receiptData;
      if (!receiptData || typeof receiptData !== 'string') {
        throw new BadRequestException('receiptData is required for iOS');
      }
      const result = await this.appleIap.validateReceipt(receiptData);
      if (!result) {
        return { ok: false, message: 'Invalid or expired receipt' };
      }
      await this.upsertSubscriptionFromApple(userId, result, receiptData);
      return { ok: true, plan: result.plan };
    }

    if (platform === 'android' || platform === 'web') {
      const sessionId = payload.sessionId;
      if (!sessionId || typeof sessionId !== 'string') {
        throw new BadRequestException('sessionId is required for Android/web (Stripe)');
      }
      await this.syncSubscriptionFromCheckoutSession(sessionId);
      const sub = await this.prisma.subscription.findUnique({ where: { userId } });
      return { ok: true, plan: sub?.plan ?? undefined };
    }

    throw new BadRequestException('platform must be ios, android, or web');
  }

  /**
   * Update or create subscription and purchase record from validated Apple receipt.
   */
  private async upsertSubscriptionFromApple(
    userId: string,
    result: AppleReceiptSubscription,
    receiptData: string,
  ): Promise<void> {
    const periodStart = result.purchaseDate ? new Date(result.purchaseDate) : null;
    const periodEnd = result.expirationDate ? new Date(result.expirationDate) : null;
    const status = result.isActive ? 'active' : 'expired';

    const sub = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: result.plan,
        status,
        platform: 'ios',
        appleOriginalTransactionId: result.originalTransactionId,
        appleProductId: result.productId,
        appleReceiptData: receiptData,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: result.plan,
        status,
        platform: 'ios',
        appleOriginalTransactionId: result.originalTransactionId,
        appleProductId: result.productId,
        appleReceiptData: receiptData,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.recordPurchase({
      userId,
      subscriptionId: sub.id,
      platform: 'ios',
      externalId: result.originalTransactionId,
      productId: result.productId,
      plan: result.plan,
      status,
      periodStart,
      periodEnd,
    });
  }

  /**
   * Record a purchase in the audit table (idempotent by userId + platform + externalId).
   */
  private async recordPurchase(params: {
    userId: string;
    subscriptionId?: string | null;
    platform: string;
    externalId: string;
    productId: string;
    plan: string;
    status: string;
    amountCents?: number | null;
    currency?: string | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    metadata?: string | null;
  }): Promise<void> {
    await this.prisma.purchase.upsert({
      where: {
        userId_platform_externalId: {
          userId: params.userId,
          platform: params.platform,
          externalId: params.externalId,
        },
      },
      create: {
        userId: params.userId,
        subscriptionId: params.subscriptionId,
        platform: params.platform,
        externalId: params.externalId,
        productId: params.productId,
        plan: params.plan,
        status: params.status,
        amountCents: params.amountCents,
        currency: params.currency ?? 'usd',
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        metadata: params.metadata,
      },
      update: {
        subscriptionId: params.subscriptionId,
        plan: params.plan,
        status: params.status,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
      },
    });
  }

  /**
   * Restore purchases: for iOS, validate the provided receipt and sync subscription;
   * for Stripe, re-sync from existing Stripe subscription if any.
   * Call this when user reinstalls the app or switches devices.
   */
  async restorePurchases(
    userId: string,
    options?: { platform?: 'ios' | 'android' | 'web'; receiptData?: string },
  ): Promise<{ ok: boolean; plan?: string; message?: string }> {
    const platform = options?.platform;

    if (platform === 'ios' || !platform) {
      const receiptData = options?.receiptData;
      if (receiptData) {
        const result = await this.appleIap.validateReceipt(receiptData);
        if (result) {
          await this.upsertSubscriptionFromApple(userId, result, receiptData);
          return { ok: true, plan: result.plan };
        }
      }
      const sub = await this.prisma.subscription.findUnique({ where: { userId } });
      if (sub?.platform === 'ios' && sub?.appleReceiptData) {
        const result = await this.appleIap.validateReceipt(sub.appleReceiptData);
        if (result) {
          await this.upsertSubscriptionFromApple(userId, result, sub.appleReceiptData);
          return { ok: true, plan: result.plan };
        }
      }
      if (platform === 'ios') {
        return { ok: false, message: 'No valid Apple receipt to restore' };
      }
    }

    if (platform === 'android' || platform === 'web' || !platform) {
      const sub = await this.prisma.subscription.findUnique({ where: { userId } });
      if (sub?.stripeSubscriptionId) {
        try {
          const stripe = this.ensureStripe();
          const s = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
          const firstItem = s.items.data[0];
          const rawPrice = firstItem?.price;
          const priceId = typeof rawPrice === 'string' ? rawPrice : rawPrice?.id;
          const plan = priceId ? this.planFromPriceId(priceId) : 'pro';
          const periodStart = firstItem?.current_period_start;
          const periodEnd = firstItem?.current_period_end;
          await this.prisma.subscription.update({
            where: { userId },
            data: {
              plan,
              status: s.status === 'active' ? 'active' : s.status,
              currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
              cancelAtPeriodEnd: s.cancel_at_period_end ?? false,
            },
          });
          return { ok: true, plan };
        } catch (e) {
          this.logger.warn(`Restore Stripe subscription failed: ${(e as Error).message}`);
        }
      }
      if (platform === 'android' || platform === 'web') {
        return { ok: false, message: 'No Stripe subscription found to restore' };
      }
    }

    return { ok: false, message: 'Nothing to restore' };
  }

  /**
   * Optional: return available products (Apple product IDs and Stripe price IDs) for the app.
   */
  async getProducts(): Promise<{
    apple: { productId: string; plan: string }[];
    stripe: { priceId: string; plan: string }[];
  }> {
    const apple = Object.entries(APPLE_PRODUCT_TO_PLAN).map(([productId, plan]) => ({
      productId,
      plan,
    }));
    const stripe = Object.entries(PRICE_TO_PLAN).map(([priceId, plan]) => ({
      priceId,
      plan,
    }));
    return { apple, stripe };
  }

  /**
   * Handle Apple App Store Server Notifications (V2 signed payload).
   * Configure the URL in App Store Connect → App → App Information → App Store Server Notifications.
   * Payload is a signed JWS; we decode and handle subscription lifecycle (renewal, cancellation, etc.).
   */
  async handleAppleWebhook(signedPayload: string): Promise<void> {
    if (!this.config.isAppleIapConfigured) {
      this.logger.warn('Apple IAP not configured; ignoring Apple webhook.');
      return;
    }
    // Decode JWS: payload is base64url. We only need the payload body for notificationType and subtype.
    try {
      const parts = signedPayload.split('.');
      if (parts.length !== 3) {
        this.logger.warn('Apple webhook: invalid JWS format');
        return;
      }
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson) as {
        notificationType?: string;
        subtype?: string;
        data?: { appAppleId?: number; bundleId?: string; bundleVersion?: string; environment?: string; signedTransactionInfo?: string; signedRenewalInfo?: string };
      };
      const notificationType = payload.notificationType;
      const data = payload.data;
      if (!data?.signedTransactionInfo) {
        this.logger.debug('Apple webhook: no signedTransactionInfo');
        return;
      }
      const txParts = (data.signedTransactionInfo as string).split('.');
      const txPayload = txParts.length === 3 ? JSON.parse(Buffer.from(txParts[1], 'base64url').toString('utf8')) as { originalTransactionId?: string; productId?: string; expiresDate?: number } : null;
      if (!txPayload?.originalTransactionId) {
        return;
      }
      const originalTransactionId = txPayload.originalTransactionId;
      const productId = txPayload.productId;
      const expiresDate = txPayload.expiresDate;
      if (!originalTransactionId || !productId) {
        this.logger.debug('Apple webhook: missing originalTransactionId or productId');
        return;
      }

      const purchase = await this.prisma.purchase.findFirst({
        where: { platform: 'ios', externalId: originalTransactionId },
        include: { user: true },
      });
      if (!purchase?.user) {
        this.logger.debug(`Apple webhook: no purchase found for originalTransactionId=${originalTransactionId}`);
        return;
      }
      const userId = purchase.userId;
      const plan = this.appleIap.productIdToPlan(productId);

      if (notificationType === 'SUBSCRIBED' || notificationType === 'DID_RENEW' || (notificationType === 'DID_CHANGE_RENEWAL_PREF' && payload.subtype === 'UPGRADE')) {
        await this.prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: 'active',
            platform: 'ios',
            appleOriginalTransactionId: originalTransactionId,
            appleProductId: productId,
            currentPeriodEnd: expiresDate ? new Date(expiresDate) : null,
          },
          update: {
            plan,
            status: 'active',
            appleProductId: productId,
            currentPeriodEnd: expiresDate ? new Date(expiresDate) : null,
          },
        });
        await this.prisma.purchase.updateMany({
          where: { userId, platform: 'ios', externalId: originalTransactionId },
          data: { status: 'active', periodEnd: expiresDate ? new Date(expiresDate) : undefined },
        });
        this.logger.log(`Apple webhook: updated subscription for user ${userId} (${notificationType})`);
      } else if (notificationType === 'EXPIRED' || notificationType === 'REVOKE' || notificationType === 'REFUND' || (notificationType === 'DID_FAIL_TO_RENEW' && payload.subtype === 'GRACE_PERIOD_EXPIRED')) {
        await this.prisma.subscription.updateMany({
          where: { userId },
          data: { status: 'expired' },
        });
        await this.prisma.purchase.updateMany({
          where: { userId, platform: 'ios', externalId: originalTransactionId },
          data: { status: 'expired' },
        });
        this.logger.log(`Apple webhook: expired/revoked subscription for user ${userId} (${notificationType})`);
      }
    } catch (err) {
      this.logger.warn(`Apple webhook parse/process error: ${(err as Error).message}`);
    }
  }

  /** Create Stripe checkout session; create customer if needed. */
  async createCheckoutSession(userId: string, priceId: string): Promise<{ url: string }> {
    const stripe = this.ensureStripe();
    let subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    let customerId = subscription?.stripeCustomerId ?? null;

    if (!customerId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: 'starter',
          status: 'inactive',
          platform: 'android',
          stripeCustomerId: customerId,
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const successUrl = this.config.stripeSuccessUrl;
    const cancelUrl = this.config.stripeCancelUrl;
    if (!successUrl || !cancelUrl) {
      throw new BadRequestException(
        'Stripe checkout requires STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL. Success URL must include ?session_id={CHECKOUT_SESSION_ID} (see STRIPE_SETUP.md)',
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    });

    const url = session.url;
    if (!url) {
      throw new BadRequestException('Failed to create checkout session');
    }
    return { url };
  }

  /**
   * Sync subscription from a Stripe checkout session (e.g. when user lands on payment-success with session_id).
   * Idempotent with webhook: safe to call even if webhook already processed the session.
   */
  async syncSubscriptionFromCheckoutSession(sessionId: string): Promise<void> {
    const stripe = this.ensureStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
    const subscriptionId =
      typeof session.subscription === 'object' && session.subscription
        ? session.subscription.id
        : (session.subscription as string | null);

    let userId: string | null =
      (session.metadata?.userId as string) ??
      (typeof session.subscription === 'object' &&
        (session.subscription as Stripe.Subscription)?.metadata?.userId);

    if (!userId && customerId) {
      const existing = await this.prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
        select: { userId: true },
      });
      userId = existing?.userId ?? null;
    }

    if (!userId || !subscriptionId) {
      this.logger.warn(
        `syncSubscriptionFromCheckoutSession: missing userId or subscriptionId (session_id=${sessionId}, customerId=${customerId})`,
      );
      return;
    }

    const sub =
      typeof session.subscription === 'object' && session.subscription
        ? (session.subscription as Stripe.Subscription)
        : await stripe.subscriptions.retrieve(subscriptionId);

    const firstItem = sub.items.data[0];
    const rawPrice = firstItem?.price;
    const priceId =
      typeof rawPrice === 'string' ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;
    const plan = priceId ? this.planFromPriceId(priceId) : 'pro';
    const periodStart = firstItem?.current_period_start;
    const periodEnd = firstItem?.current_period_end;

    const platformStripe = 'android'; // or 'web' if you detect web checkout via metadata
    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'active',
        platform: platformStripe,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodStart: periodStart != null ? new Date(periodStart * 1000) : null,
        currentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
      },
      update: {
        plan,
        status: 'active',
        platform: platformStripe,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodStart: periodStart != null ? new Date(periodStart * 1000) : null,
        currentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: false,
      },
    });
    this.logger.log(`Synced subscription for user ${userId} (session_id=${sessionId})`);
  }

  /** Handle Stripe webhook (checkout.session.completed, customer.subscription.updated/deleted). */
  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
    const stripe = this.ensureStripe();
    const secret = this.config.stripeWebhookSecret;
    if (!secret || !signature) {
      throw new BadRequestException('Webhook secret or signature missing');
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | null;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        let userId: string | undefined =
          (session.metadata?.userId as string) ?? (session.subscription as any)?.metadata?.userId;
        if (!userId && customerId) {
          const existing = await this.prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
            select: { userId: true },
          });
          userId = existing?.userId ?? undefined;
        }
        if (!userId || !subscriptionId) {
          this.logger.warn(
            `webhook checkout.session.completed: missing userId or subscriptionId (customerId=${customerId})`,
          );
          break;
        }
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const firstItem = sub.items.data[0];
        const rawPrice = firstItem?.price;
        const priceId =
          typeof rawPrice === 'string' ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;
        const plan = priceId ? this.planFromPriceId(priceId) : 'pro';
        const periodStart = firstItem?.current_period_start;
        const periodEnd = firstItem?.current_period_end;
        await this.prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: 'active',
            platform: 'android',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodStart: periodStart != null ? new Date(periodStart * 1000) : null,
            currentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
          },
          update: {
            plan,
            status: 'active',
            platform: 'android',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodStart: periodStart != null ? new Date(periodStart * 1000) : null,
            currentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
            cancelAtPeriodEnd: false,
          },
        });
        this.logger.log(`Webhook: synced subscription for user ${userId}`);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        const firstItem = sub.items.data[0];
        const priceId = firstItem?.price?.id;
        const plan = priceId ? this.planFromPriceId(priceId) : 'pro';
        const periodStart = firstItem?.current_period_start;
        const periodEnd = firstItem?.current_period_end;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan,
            status: sub.status === 'active' ? 'active' : sub.status,
            currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'cancelled', cancelAtPeriodEnd: false },
        });
        break;
      }
      default:
        break;
    }
  }

  /** Set cancel_at_period_end on the subscription. */
  async cancelSubscription(userId: string): Promise<void> {
    const stripe = this.ensureStripe();
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription to cancel');
    }
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
  }

  /** Restore subscription (remove cancel_at_period_end). Used when user reinstalls app. */
  async restoreSubscription(userId: string): Promise<void> {
    const stripe = this.ensureStripe();
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No subscription found');
    }
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: false },
    });
  }

  /** Reset usage for all users for the given month (call from cron). */
  async resetUsageForMonth(month: string): Promise<number> {
    const result = await this.prisma.usage.updateMany({
      where: { month },
      data: {
        aiGenerationsCount: 0,
        virtualTryonCount: 0,
        weeklyGenerationCount: 0,
      },
    });
    return result.count;
  }
}
