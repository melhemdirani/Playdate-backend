-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('SYSTEM', 'GAME');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "category" "NotificationCategory" NOT NULL DEFAULT 'GAME';
