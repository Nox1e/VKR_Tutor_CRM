-- Drop the unused pdf_file column from homeworks. The UI no longer writes
-- to it; ДЗ-материалы хранятся только в `link`.

ALTER TABLE "homeworks" DROP COLUMN IF EXISTS "pdf_file";
