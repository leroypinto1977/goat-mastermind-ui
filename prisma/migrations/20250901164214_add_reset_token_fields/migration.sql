-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "reset_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expires" TIMESTAMP(3);
