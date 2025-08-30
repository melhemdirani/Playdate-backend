/*
  Warnings:

  - Added the required column `startDate` to the `UserGameScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserGameScore" ADD COLUMN     "startDate" TEXT NOT NULL;
