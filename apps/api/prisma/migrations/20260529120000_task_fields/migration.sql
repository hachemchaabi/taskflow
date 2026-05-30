-- Migration: task_fields
-- Replaces single assigneeId/dueDate on Card with many-to-many assignees
-- and startDate/endDate. Backfills data before dropping old columns.

-- Drop the old single-assignee FK first.
ALTER TABLE "Card" DROP CONSTRAINT "Card_assigneeId_fkey";

-- Add new date columns; existing dueDate data is preserved into endDate.
ALTER TABLE "Card" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Card" ADD COLUMN "endDate" TIMESTAMP(3);
UPDATE "Card" SET "endDate" = "dueDate" WHERE "dueDate" IS NOT NULL;

-- Add optional cardId to Activity.
ALTER TABLE "Activity" ADD COLUMN "cardId" TEXT;

-- Create the many-to-many join table (A = Card.id, B = User.id).
CREATE TABLE "_CardAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CardAssignees_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_CardAssignees_B_index" ON "_CardAssignees"("B");

-- Backfill join table from existing single assignee (confirmed A=Card.id, B=User.id).
INSERT INTO "_CardAssignees" ("A", "B")
SELECT "id", "assigneeId" FROM "Card" WHERE "assigneeId" IS NOT NULL;

-- Now it is safe to drop the old columns.
ALTER TABLE "Card" DROP COLUMN "assigneeId";
ALTER TABLE "Card" DROP COLUMN "dueDate";

-- Add foreign keys.
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_cardId_fkey"
    FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_CardAssignees" ADD CONSTRAINT "_CardAssignees_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_CardAssignees" ADD CONSTRAINT "_CardAssignees_B_fkey"
    FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
