-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'tutor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "jti" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "code" TEXT NOT NULL,
    "created_by" INTEGER,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "telegram" TEXT,
    "phone" TEXT,
    "birth_date" TEXT,
    "timezone" TEXT,
    "parent_name" TEXT,
    "parent_telegram" TEXT,
    "parent_phone" TEXT,
    "hourly_rate" DOUBLE PRECISION,
    "lessons_per_month" INTEGER,
    "lesson_duration" INTEGER,
    "payment_type" TEXT,
    "monthly_revenue" DOUBLE PRECISION,
    "acquisition_cost" DOUBLE PRECISION,
    "acquisition_source" TEXT,
    "photo_data" TEXT,
    "paid_lessons_count" INTEGER NOT NULL DEFAULT 0,
    "manual_task_progress" JSONB,
    "learning_trajectory" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "meet_link" TEXT,
    "comment" TEXT,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "preparation_id" TEXT,
    "homework_id" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervals" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_lessons" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "meet_link" TEXT,
    "comment" TEXT,
    "preparation_id" TEXT,
    "homework_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preparations" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "task_number" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preparations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeworks" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "task_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "pdf_file" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trials" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_number" INTEGER NOT NULL,
    "difficulty_level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_trials" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_id" TEXT NOT NULL,
    "trial_id" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "complications" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_results" (
    "id" TEXT NOT NULL,
    "student_trial_id" TEXT NOT NULL,
    "task_scores" JSONB NOT NULL,
    "primary_score" INTEGER NOT NULL,
    "secondary_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trial_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_id" TEXT NOT NULL,
    "lessons_count" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trajectory_items" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_id" TEXT NOT NULL,
    "preparation_id" TEXT NOT NULL,
    "homework_id" TEXT,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "assigned_to_lesson_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trajectory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "students_user_id_idx" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "lessons_user_id_idx" ON "lessons"("user_id");

-- CreateIndex
CREATE INDEX "lessons_user_id_start_time_idx" ON "lessons"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "lessons_student_id_idx" ON "lessons"("student_id");

-- CreateIndex
CREATE INDEX "intervals_lesson_id_idx" ON "intervals"("lesson_id");

-- CreateIndex
CREATE INDEX "scheduled_lessons_user_id_idx" ON "scheduled_lessons"("user_id");

-- CreateIndex
CREATE INDEX "scheduled_lessons_user_id_day_of_week_idx" ON "scheduled_lessons"("user_id", "day_of_week");

-- CreateIndex
CREATE INDEX "scheduled_lessons_student_id_idx" ON "scheduled_lessons"("student_id");

-- CreateIndex
CREATE INDEX "preparations_user_id_idx" ON "preparations"("user_id");

-- CreateIndex
CREATE INDEX "homeworks_user_id_idx" ON "homeworks"("user_id");

-- CreateIndex
CREATE INDEX "trials_user_id_idx" ON "trials"("user_id");

-- CreateIndex
CREATE INDEX "student_trials_user_id_idx" ON "student_trials"("user_id");

-- CreateIndex
CREATE INDEX "student_trials_student_id_idx" ON "student_trials"("student_id");

-- CreateIndex
CREATE INDEX "student_trials_trial_id_idx" ON "student_trials"("trial_id");

-- CreateIndex
CREATE INDEX "trial_results_student_trial_id_idx" ON "trial_results"("student_trial_id");

-- CreateIndex
CREATE INDEX "payment_history_user_id_idx" ON "payment_history"("user_id");

-- CreateIndex
CREATE INDEX "payment_history_student_id_idx" ON "payment_history"("student_id");

-- CreateIndex
CREATE INDEX "trajectory_items_user_id_idx" ON "trajectory_items"("user_id");

-- CreateIndex
CREATE INDEX "trajectory_items_student_id_status_idx" ON "trajectory_items"("student_id", "status");

-- CreateIndex
CREATE INDEX "trajectory_items_student_id_position_idx" ON "trajectory_items"("student_id", "position");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_preparation_id_fkey" FOREIGN KEY ("preparation_id") REFERENCES "preparations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervals" ADD CONSTRAINT "intervals_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_lessons" ADD CONSTRAINT "scheduled_lessons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_lessons" ADD CONSTRAINT "scheduled_lessons_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_lessons" ADD CONSTRAINT "scheduled_lessons_preparation_id_fkey" FOREIGN KEY ("preparation_id") REFERENCES "preparations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_lessons" ADD CONSTRAINT "scheduled_lessons_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparations" ADD CONSTRAINT "preparations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trials" ADD CONSTRAINT "trials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_trials" ADD CONSTRAINT "student_trials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_trials" ADD CONSTRAINT "student_trials_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_trials" ADD CONSTRAINT "student_trials_trial_id_fkey" FOREIGN KEY ("trial_id") REFERENCES "trials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_results" ADD CONSTRAINT "trial_results_student_trial_id_fkey" FOREIGN KEY ("student_trial_id") REFERENCES "student_trials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trajectory_items" ADD CONSTRAINT "trajectory_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trajectory_items" ADD CONSTRAINT "trajectory_items_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trajectory_items" ADD CONSTRAINT "trajectory_items_preparation_id_fkey" FOREIGN KEY ("preparation_id") REFERENCES "preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trajectory_items" ADD CONSTRAINT "trajectory_items_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trajectory_items" ADD CONSTRAINT "trajectory_items_assigned_to_lesson_id_fkey" FOREIGN KEY ("assigned_to_lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
