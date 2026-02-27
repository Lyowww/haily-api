/** Plan limits: -1 means unlimited. */
export const PLAN_LIMITS: Record<string, { ai: number; virtualTryOn: number; weekly: number }> = {
  starter: { ai: 3, virtualTryOn: 3, weekly: 1 },
  pro: { ai: -1, virtualTryOn: -1, weekly: -1 },
  premium: { ai: -1, virtualTryOn: -1, weekly: -1 },
};

/** Map Stripe price ID to plan name. Must match prices in Stripe Dashboard. */
export const PRICE_TO_PLAN: Record<string, string> = {
  'price_1T4momCX1sAb9PefwLq9SJ2X': 'pro',       // STRIPE_PRO_MONTHLY_PRICE_ID
  'price_1T4mpUCX1sAb9Pef81TKmX4Q': 'pro',       // STRIPE_PRO_YEARLY_PRICE_ID
  'price_1T4mp5CX1sAb9PefsYBppauP': 'premium',   // STRIPE_PREMIUM_MONTHLY_PRICE_ID
  'price_1T4mpoCX1sAb9Pef1q8CPHTC': 'premium',   // STRIPE_PREMIUM_YEARLY_PRICE_ID
};

/**
 * Map Apple IAP product IDs to plan name.
 * Must match product IDs configured in App Store Connect.
 */
export const APPLE_PRODUCT_TO_PLAN: Record<string, string> = {
  'com.haily.app.pro.monthly': 'pro',
  'com.haily.app.premium.monthly': 'premium',
};
