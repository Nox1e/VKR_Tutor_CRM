-- Per-user read state for computed notifications. The notification body is
-- not stored — only the (userId, notificationId) pair and its read timestamp.

CREATE TABLE "notification_states" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_states_user_id_notification_id_key"
    ON "notification_states"("user_id", "notification_id");
CREATE INDEX "notification_states_user_id_idx" ON "notification_states"("user_id");

ALTER TABLE "notification_states"
    ADD CONSTRAINT "notification_states_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
