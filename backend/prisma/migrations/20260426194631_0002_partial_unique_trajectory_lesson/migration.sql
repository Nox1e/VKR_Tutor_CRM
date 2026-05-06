-- Partial unique index: at most one trajectory_item can be assigned to a given
-- lesson at a time. NULL `assigned_to_lesson_id` means "not yet assigned" and
-- is allowed in unlimited rows. Prisma cannot express partial indexes natively,
-- so this migration is hand-written.

CREATE UNIQUE INDEX "idx_one_item_per_lesson"
  ON "trajectory_items" ("assigned_to_lesson_id")
  WHERE "assigned_to_lesson_id" IS NOT NULL;
