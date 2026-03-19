ALTER TABLE "wardrobe_items"
  ADD COLUMN IF NOT EXISTS "is_favorite" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "wardrobe_items_user_id_is_favorite_idx"
  ON "wardrobe_items"("user_id", "is_favorite");
