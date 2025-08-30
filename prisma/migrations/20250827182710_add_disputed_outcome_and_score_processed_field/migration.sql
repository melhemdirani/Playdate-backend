-- AlterEnum
ALTER TYPE "MatchOutcome" ADD VALUE 'DISPUTED';

-- AlterTable
ALTER TABLE "MatchResult" ADD COLUMN     "scoreProcessed" BOOLEAN NOT NULL DEFAULT false;
