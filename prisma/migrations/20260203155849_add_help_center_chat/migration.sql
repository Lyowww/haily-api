-- CreateTable
CREATE TABLE "help_center_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "help_center_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "help_center_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "help_center_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "help_center_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "help_center_conversations_user_id_idx" ON "help_center_conversations"("user_id");

-- CreateIndex
CREATE INDEX "help_center_conversations_status_idx" ON "help_center_conversations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "help_center_conversations_user_id_key" ON "help_center_conversations"("user_id");

-- CreateIndex
CREATE INDEX "help_center_messages_conversation_id_idx" ON "help_center_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "help_center_messages_created_at_idx" ON "help_center_messages"("created_at");
