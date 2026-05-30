-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NONE');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'NONE';
