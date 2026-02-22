-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_wardrobe_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'accessory',
    "color_family" TEXT NOT NULL DEFAULT 'unknown',
    "color_hex" TEXT,
    "style_tags" TEXT NOT NULL DEFAULT '[]',
    "season_tags" TEXT NOT NULL DEFAULT '["all_season"]',
    "fit_tag" TEXT NOT NULL DEFAULT 'unknown',
    "extra_tags" TEXT,
    "confidence" TEXT NOT NULL DEFAULT '{"category":0.5,"color":0.5,"style":0.5}',
    "raw_ai_json" TEXT,
    "user_notes" TEXT,
    "product_type" TEXT,
    "color" TEXT,
    "tags" TEXT,
    "brand" TEXT,
    "size" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wardrobe_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_wardrobe_items" ("brand", "category", "color", "created_at", "id", "image_url", "product_type", "size", "tags", "updated_at", "user_id") SELECT "brand", "category", "color", "created_at", "id", "image_url", "product_type", "size", "tags", "updated_at", "user_id" FROM "wardrobe_items";
DROP TABLE "wardrobe_items";
ALTER TABLE "new_wardrobe_items" RENAME TO "wardrobe_items";
CREATE INDEX "wardrobe_items_user_id_idx" ON "wardrobe_items"("user_id");
CREATE INDEX "wardrobe_items_category_idx" ON "wardrobe_items"("category");
CREATE INDEX "wardrobe_items_color_family_idx" ON "wardrobe_items"("color_family");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
