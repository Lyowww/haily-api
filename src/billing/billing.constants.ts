/** Plan limits: -1 means unlimited. */
export const PLAN_LIMITS: Record<string, { ai: number; virtualTryOn: number; weekly: number }> = {
  starter: { ai: 3, virtualTryOn: 3, weekly: 1 },
  pro: { ai: -1, virtualTryOn: -1, weekly: -1 },
  premium: { ai: -1, virtualTryOn: -1, weekly: -1 },
};

/** Map Stripe price ID to plan name (override in env or extend as needed). */
export const PRICE_TO_PLAN: Record<string, string> = {
  // Example: 'price_xxx': 'starter', 'price_yyy': 'pro', 'price_zzz': 'premium'
};
