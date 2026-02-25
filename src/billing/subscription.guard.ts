import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService } from './billing.service';

export const SUBSCRIPTION_CHECK_KEY = 'subscriptionCheck';
export type SubscriptionCheckType = 'ai' | 'virtualTryon' | 'weekly' | 'aiAndVirtualTryon';

/**
 * Guard that ensures user has an active subscription and has not exceeded usage limits.
 * Apply to routes that require subscription (e.g. /ai/generate-outfit, /outfit/weekly/generate).
 * Use SetMetadata(SUBSCRIPTION_CHECK_KEY, 'ai' | 'virtualTryon' | 'weekly') on the handler.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const check = this.reflector.getAllAndOverride<SubscriptionCheckType | undefined>(
      SUBSCRIPTION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!check) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = user?.id ?? user?.userId;
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    switch (check) {
      case 'ai':
        await this.billingService.assertCanUseAi(userId);
        break;
      case 'virtualTryon':
        await this.billingService.assertCanUseVirtualTryon(userId);
        break;
      case 'weekly':
        await this.billingService.assertCanUseWeeklyGenerate(userId);
        break;
      case 'aiAndVirtualTryon':
        await this.billingService.assertCanUseAi(userId);
        await this.billingService.assertCanUseVirtualTryon(userId);
        break;
      default:
        break;
    }
    return true;
  }
}
