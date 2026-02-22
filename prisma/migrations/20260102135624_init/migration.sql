-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "avatar_base_image_url" TEXT,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wardrobe_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "color" TEXT,
    "tags" TEXT,
    "brand" TEXT,
    "size" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wardrobe_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "outfits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "week_start_date" DATETIME NOT NULL,
    "day_index" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "image_url" TEXT,
    "prompt_version" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "outfits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "outfit_items" (
    "outfit_id" TEXT NOT NULL,
    "wardrobe_item_id" TEXT NOT NULL,

    PRIMARY KEY ("outfit_id", "wardrobe_item_id"),
    CONSTRAINT "outfit_items_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outfit_items_wardrobe_item_id_fkey" FOREIGN KEY ("wardrobe_item_id") REFERENCES "wardrobe_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "render_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "outfit_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "started_at" DATETIME,
    "finished_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "render_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "render_jobs_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credits_ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "ref_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credits_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_start" DATETIME,
    "current_period_end" DATETIME,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "event_name" TEXT NOT NULL,
    "props" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "user_photos_user_id_idx" ON "user_photos"("user_id");

-- CreateIndex
CREATE INDEX "user_photos_user_id_is_primary_idx" ON "user_photos"("user_id", "is_primary");

-- CreateIndex
CREATE INDEX "wardrobe_items_user_id_idx" ON "wardrobe_items"("user_id");

-- CreateIndex
CREATE INDEX "wardrobe_items_user_id_category_idx" ON "wardrobe_items"("user_id", "category");

-- CreateIndex
CREATE INDEX "wardrobe_items_user_id_product_type_idx" ON "wardrobe_items"("user_id", "product_type");

-- CreateIndex
CREATE INDEX "wardrobe_items_created_at_idx" ON "wardrobe_items"("created_at");

-- CreateIndex
CREATE INDEX "outfits_user_id_idx" ON "outfits"("user_id");

-- CreateIndex
CREATE INDEX "outfits_user_id_week_start_date_idx" ON "outfits"("user_id", "week_start_date");

-- CreateIndex
CREATE INDEX "outfits_user_id_status_idx" ON "outfits"("user_id", "status");

-- CreateIndex
CREATE INDEX "outfits_status_idx" ON "outfits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "outfits_user_id_week_start_date_day_index_key" ON "outfits"("user_id", "week_start_date", "day_index");

-- CreateIndex
CREATE INDEX "outfit_items_outfit_id_idx" ON "outfit_items"("outfit_id");

-- CreateIndex
CREATE INDEX "outfit_items_wardrobe_item_id_idx" ON "outfit_items"("wardrobe_item_id");

-- CreateIndex
CREATE INDEX "render_jobs_user_id_idx" ON "render_jobs"("user_id");

-- CreateIndex
CREATE INDEX "render_jobs_outfit_id_idx" ON "render_jobs"("outfit_id");

-- CreateIndex
CREATE INDEX "render_jobs_status_idx" ON "render_jobs"("status");

-- CreateIndex
CREATE INDEX "render_jobs_user_id_status_idx" ON "render_jobs"("user_id", "status");

-- CreateIndex
CREATE INDEX "render_jobs_created_at_idx" ON "render_jobs"("created_at");

-- CreateIndex
CREATE INDEX "credits_ledger_user_id_idx" ON "credits_ledger"("user_id");

-- CreateIndex
CREATE INDEX "credits_ledger_user_id_created_at_idx" ON "credits_ledger"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "credits_ledger_ref_id_idx" ON "credits_ledger"("ref_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "events_analytics_user_id_idx" ON "events_analytics"("user_id");

-- CreateIndex
CREATE INDEX "events_analytics_event_name_idx" ON "events_analytics"("event_name");

-- CreateIndex
CREATE INDEX "events_analytics_user_id_event_name_idx" ON "events_analytics"("user_id", "event_name");

-- CreateIndex
CREATE INDEX "events_analytics_created_at_idx" ON "events_analytics"("created_at");
