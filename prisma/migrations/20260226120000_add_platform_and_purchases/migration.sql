-- AlterTable: add platform and Apple IAP columns to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "platform" TEXT DEFAULT 'android';
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "apple_original_transaction_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "apple_product_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "apple_receipt_data" TEXT;

-- CreateIndex (PostgreSQL: create index only if not exists via separate statements)
CREATE INDEX IF NOT EXISTS "subscriptions_platform_idx" ON "subscriptions"("platform");
CREATE INDEX IF NOT EXISTS "subscriptions_apple_original_transaction_id_idx" ON "subscriptions"("apple_original_transaction_id");

-- CreateTable: purchases (audit trail and restore)
CREATE TABLE IF NOT EXISTS "purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "platform" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "amount_cents" INTEGER,
    "currency" TEXT DEFAULT 'usd',
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "purchases_user_id_platform_external_id_key" ON "purchases"("user_id", "platform", "external_id");
CREATE INDEX IF NOT EXISTS "purchases_user_id_idx" ON "purchases"("user_id");
CREATE INDEX IF NOT EXISTS "purchases_platform_idx" ON "purchases"("platform");
CREATE INDEX IF NOT EXISTS "purchases_external_id_idx" ON "purchases"("external_id");
CREATE INDEX IF NOT EXISTS "purchases_subscription_id_idx" ON "purchases"("subscription_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchases_user_id_fkey'
  ) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchases_subscription_id_fkey'
  ) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
