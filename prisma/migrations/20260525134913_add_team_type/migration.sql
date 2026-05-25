-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('REGULAR', 'SPECIAL');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "type" "TeamType" NOT NULL DEFAULT 'REGULAR';
