import { SetMetadata } from '@nestjs/common';
import { SUBSCRIPTION_CHECK_KEY, SubscriptionCheckType } from './subscription.guard';

export const SubscriptionCheck = (check: SubscriptionCheckType) =>
  SetMetadata(SUBSCRIPTION_CHECK_KEY, check);
