-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "has_changed_temp_password" BOOLEAN NOT NULL DEFAULT false;
