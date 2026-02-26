-- CreateTable
CREATE TABLE "usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "ai_generations_count" INTEGER NOT NULL DEFAULT 0,
    "virtual_tryon_count" INTEGER NOT NULL DEFAULT 0,
    "weekly_generation_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_user_id_month_key" ON "usage"("user_id", "month");

-- CreateIndex
CREATE INDEX "usage_user_id_idx" ON "usage"("user_id");

-- CreateIndex
CREATE INDEX "usage_month_idx" ON "usage"("month");

-- AddForeignKey
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
