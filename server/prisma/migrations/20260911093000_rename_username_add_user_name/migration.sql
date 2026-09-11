-- Rename the existing "username" column to "user_id" (preserves data)
ALTER TABLE "users" RENAME COLUMN "username" TO "user_id";

-- Rename the unique index to match the new column name
ALTER INDEX "users_username_key" RENAME TO "users_user_id_key";

-- Add the new display-name column (nullable initially for backfill)
ALTER TABLE "users" ADD COLUMN "user_name" TEXT;

-- Backfill: copy user_id into user_name for all existing rows
UPDATE "users" SET "user_name" = "user_id" WHERE "user_name" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "users" ALTER COLUMN "user_name" SET NOT NULL;
