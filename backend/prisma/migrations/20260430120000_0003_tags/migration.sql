-- Tag tables (user-scoped, one set per entity type).

CREATE TABLE "preparation_tags" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preparation_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "homework_tags" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trial_tags" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trial_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "preparation_tags_user_id_name_key" ON "preparation_tags"("user_id", "name");
CREATE INDEX "preparation_tags_user_id_idx" ON "preparation_tags"("user_id");

CREATE UNIQUE INDEX "homework_tags_user_id_name_key" ON "homework_tags"("user_id", "name");
CREATE INDEX "homework_tags_user_id_idx" ON "homework_tags"("user_id");

CREATE UNIQUE INDEX "trial_tags_user_id_name_key" ON "trial_tags"("user_id", "name");
CREATE INDEX "trial_tags_user_id_idx" ON "trial_tags"("user_id");

ALTER TABLE "preparation_tags"
    ADD CONSTRAINT "preparation_tags_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "homework_tags"
    ADD CONSTRAINT "homework_tags_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trial_tags"
    ADD CONSTRAINT "trial_tags_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Implicit M2M join tables (Prisma convention: _ModelAToModelB, lexicographic order).

CREATE TABLE "_HomeworkToHomeworkTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HomeworkToHomeworkTag_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_HomeworkToHomeworkTag_B_index" ON "_HomeworkToHomeworkTag"("B");

ALTER TABLE "_HomeworkToHomeworkTag"
    ADD CONSTRAINT "_HomeworkToHomeworkTag_A_fkey"
    FOREIGN KEY ("A") REFERENCES "homeworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_HomeworkToHomeworkTag"
    ADD CONSTRAINT "_HomeworkToHomeworkTag_B_fkey"
    FOREIGN KEY ("B") REFERENCES "homework_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "_PreparationToPreparationTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PreparationToPreparationTag_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_PreparationToPreparationTag_B_index" ON "_PreparationToPreparationTag"("B");

ALTER TABLE "_PreparationToPreparationTag"
    ADD CONSTRAINT "_PreparationToPreparationTag_A_fkey"
    FOREIGN KEY ("A") REFERENCES "preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PreparationToPreparationTag"
    ADD CONSTRAINT "_PreparationToPreparationTag_B_fkey"
    FOREIGN KEY ("B") REFERENCES "preparation_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "_TrialToTrialTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrialToTrialTag_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_TrialToTrialTag_B_index" ON "_TrialToTrialTag"("B");

ALTER TABLE "_TrialToTrialTag"
    ADD CONSTRAINT "_TrialToTrialTag_A_fkey"
    FOREIGN KEY ("A") REFERENCES "trials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TrialToTrialTag"
    ADD CONSTRAINT "_TrialToTrialTag_B_fkey"
    FOREIGN KEY ("B") REFERENCES "trial_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
