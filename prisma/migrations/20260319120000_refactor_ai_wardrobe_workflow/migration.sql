-- User taste profile for onboarding personalization
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "taste_profile" JSONB,
  ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP(3);

-- User-owned wardrobe metadata for AI-driven recommendations
ALTER TABLE "wardrobe_items"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "subcategory" TEXT,
  ADD COLUMN IF NOT EXISTS "ai_description" TEXT,
  ADD COLUMN IF NOT EXISTS "seasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "temperature_range" JSONB,
  ADD COLUMN IF NOT EXISTS "occasions" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "wardrobe_items"
  ALTER COLUMN "tags" DROP DEFAULT;

ALTER TABLE "wardrobe_items"
  ALTER COLUMN "tags" TYPE TEXT[]
  USING CASE
    WHEN "tags" IS NULL OR BTRIM("tags") = '' THEN ARRAY[]::TEXT[]
    WHEN LEFT(BTRIM("tags"), 1) = '[' THEN ARRAY(
      SELECT jsonb_array_elements_text("tags"::jsonb)
    )
    ELSE ARRAY["tags"]
  END;

ALTER TABLE "wardrobe_items"
  ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "tags" SET NOT NULL;

UPDATE "wardrobe_items"
SET
  "name" = COALESCE("name", NULLIF("product_type", ''), INITCAP("category")),
  "subcategory" = COALESCE("subcategory", NULLIF("product_type", '')),
  "seasons" = CASE
    WHEN COALESCE(ARRAY_LENGTH("seasons", 1), 0) > 0 THEN "seasons"
    WHEN "season_tags" IS NULL OR BTRIM("season_tags") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY(
      SELECT jsonb_array_elements_text("season_tags"::jsonb)
    )
  END
WHERE TRUE;

-- User events for event-based outfit recommendations
CREATE TABLE IF NOT EXISTS "events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "type" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "events_user_id_idx" ON "events"("user_id");
CREATE INDEX IF NOT EXISTS "events_user_id_date_idx" ON "events"("user_id", "date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_user_id_fkey'
  ) THEN
    ALTER TABLE "events"
      ADD CONSTRAINT "events_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Migrate weekly outfits into saved outfits with item arrays
ALTER TABLE "outfits"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "event_id" TEXT,
  ADD COLUMN IF NOT EXISTS "items" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "ai_generated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "explanation" TEXT,
  ADD COLUMN IF NOT EXISTS "weather_match" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "style_match" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "generation_context" JSONB;

UPDATE "outfits" o
SET "items" = COALESCE((
  SELECT ARRAY_AGG(oi."wardrobe_item_id" ORDER BY oi."wardrobe_item_id")
  FROM "outfit_items" oi
  WHERE oi."outfit_id" = o."id"
), ARRAY[]::TEXT[])
WHERE TRUE;

DROP INDEX IF EXISTS "outfits_user_id_week_start_date_day_index_key";
DROP INDEX IF EXISTS "outfits_user_id_week_start_date_idx";
DROP INDEX IF EXISTS "outfits_user_id_status_idx";
DROP INDEX IF EXISTS "outfits_status_idx";

ALTER TABLE "outfits" DROP COLUMN IF EXISTS "week_start_date";
ALTER TABLE "outfits" DROP COLUMN IF EXISTS "day_index";
ALTER TABLE "outfits" DROP COLUMN IF EXISTS "status";
ALTER TABLE "outfits" DROP COLUMN IF EXISTS "image_url";
ALTER TABLE "outfits" DROP COLUMN IF EXISTS "prompt_version";
ALTER TABLE "outfits" DROP COLUMN IF EXISTS "weather";
ALTER TABLE "outfits" DROP COLUMN IF EXISTS "category";

CREATE INDEX IF NOT EXISTS "outfits_event_id_idx" ON "outfits"("event_id");
CREATE INDEX IF NOT EXISTS "outfits_ai_generated_idx" ON "outfits"("ai_generated");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'outfits_event_id_fkey'
  ) THEN
    ALTER TABLE "outfits"
      ADD CONSTRAINT "outfits_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "events"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DROP TABLE IF EXISTS "outfit_items";
