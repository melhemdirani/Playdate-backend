-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "imageFileName" TEXT,
ADD COLUMN     "imagePublicId" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "message" DROP NOT NULL;
