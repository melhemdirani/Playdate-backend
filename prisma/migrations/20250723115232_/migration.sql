-- AlterTable
ALTER TABLE "UserGame" ADD COLUMN     "gameScoreId" TEXT;

-- CreateTable
CREATE TABLE "UserGameLevel" (
    "id" TEXT NOT NULL,
    "userGameId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "level" "GameLevel" NOT NULL,

    CONSTRAINT "UserGameLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGameLevel_userGameId_gameId_key" ON "UserGameLevel"("userGameId", "gameId");

-- AddForeignKey
ALTER TABLE "UserGameLevel" ADD CONSTRAINT "UserGameLevel_userGameId_gameId_fkey" FOREIGN KEY ("userGameId", "gameId") REFERENCES "UserGame"("userId", "gameId") ON DELETE CASCADE ON UPDATE CASCADE;
