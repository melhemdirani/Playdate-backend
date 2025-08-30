-- CreateTable
CREATE TABLE "UserPinnedMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPinnedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPinnedMatch_userId_matchId_key" ON "UserPinnedMatch"("userId", "matchId");

-- AddForeignKey
ALTER TABLE "UserPinnedMatch" ADD CONSTRAINT "UserPinnedMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
