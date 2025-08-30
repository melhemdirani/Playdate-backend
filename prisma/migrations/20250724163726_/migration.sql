-- DropForeignKey
ALTER TABLE "MatchResult" DROP CONSTRAINT "MatchResult_matchId_fkey";

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
