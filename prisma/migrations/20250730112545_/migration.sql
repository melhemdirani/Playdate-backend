/*
  Warnings:

  - Added the required column `frequency` to the `UserGameScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userSelfRating` to the `UserGameScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserGameScore" ADD COLUMN     "frequency" INTEGER NOT NULL,
ADD COLUMN     "userSelfRating" INTEGER NOT NULL;
