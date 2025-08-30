-- AddForeignKey
ALTER TABLE "UserPinnedMatch" ADD CONSTRAINT "UserPinnedMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
