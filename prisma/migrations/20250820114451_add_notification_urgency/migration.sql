-- CreateEnum
CREATE TYPE "NotificationUrgency" AS ENUM ('URGENT', 'ROUTINE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "urgency" "NotificationUrgency" NOT NULL DEFAULT 'ROUTINE';
