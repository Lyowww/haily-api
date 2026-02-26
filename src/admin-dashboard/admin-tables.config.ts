/**
 * Prisma model names (camelCase) allowed for admin CRUD.
 * Must match Prisma client delegate names.
 */
export const ADMIN_TABLE_NAMES = [
  'user',
  'userPhoto',
  'wardrobeItem',
  'outfit',
  'outfitItem',
  'renderJob',
  'creditsLedger',
  'subscription',
  'usage',
  'eventAnalytics',
  'helpCenterConversation',
  'helpCenterMessage',
  'notificationSettings',
  'notification',
] as const;

export type AdminTableName = (typeof ADMIN_TABLE_NAMES)[number];
