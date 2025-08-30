/*
  Warnings:

  - You are about to drop the `UserGameLevel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserGameLevel" DROP CONSTRAINT "UserGameLevel_userGameId_gameId_fkey";

-- DropTable
DROP TABLE "UserGameLevel";

-- CreateTable
CREATE TABLE "UserGameScore" (
    "id" TEXT NOT NULL,
    "userGameId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" "GameLevel" NOT NULL,

    CONSTRAINT "UserGameScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGameScore_userGameId_gameId_key" ON "UserGameScore"("userGameId", "gameId");

-- AddForeignKey
ALTER TABLE "UserGameScore" ADD CONSTRAINT "UserGameScore_userGameId_gameId_fkey" FOREIGN KEY ("userGameId", "gameId") REFERENCES "UserGame"("userId", "gameId") ON DELETE CASCADE ON UPDATE CASCADE;
