/*
  Warnings:

  - You are about to drop the column `quote` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuoteType" AS ENUM ('PRE_GAME_RITUAL', 'SPORTS_MANTRA', 'PET_PEEVE', 'POST_GAME_CELEBRATION', 'HYPE_SONG');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "quote",
ADD COLUMN     "quoteAnswer" TEXT,
ADD COLUMN     "quoteType" "QuoteType";
