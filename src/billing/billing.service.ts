import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '../config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { PLAN_LIMITS, PRICE_TO_PLAN } from './billing.constants';

export interface SubscriptionStatus {
  plan: string;
  status: string;
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
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const plan = subscription?.plan ?? 'starter';
    const limits = this.getPlanLimits(plan);
    const isActive = subscription?.status === 'active'; // still active when cancel_at_period_end until period end

    if (!subscription || !isActive) {
      return {
        plan: 'starter',
        status: subscription?.status ?? 'inactive',
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
          stripeCustomerId: customerId,
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const successUrl = this.config.stripeSuccessUrl;
    const cancelUrl = this.config.stripeCancelUrl;
    if (!successUrl || !cancelUrl) {
      throw new BadRequestException(
        'Stripe checkout requires STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL (e.g. https://your-api.vercel.app/api/payment-success)',
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

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'active',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodStart: periodStart != null ? new Date(periodStart * 1000) : null,
        currentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
      },
      update: {
        plan,
        status: 'active',
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
        let userId = (session.metadata?.userId as string) ?? (session.subscription as any)?.metadata?.userId;
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
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodStart: periodStart != null ? new Date(periodStart * 1000) : null,
            currentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
          },
          update: {
            plan,
            status: 'active',
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
