-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- AlterTable: add new columns. `slug` starts nullable so existing rows can be
-- backfilled before the NOT NULL + unique constraint is applied.
ALTER TABLE "Workspace" ADD COLUMN     "slug" TEXT;
ALTER TABLE "Workspace" ADD COLUMN     "logoUrl" TEXT;
ALTER TABLE "Workspace" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Workspace" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE "Workspace" ADD COLUMN     "defaultMemberRole" "MemberRole" NOT NULL DEFAULT 'MEMBER';

-- Backfill slug from name: lowercase, non-alphanumerics → hyphens, trim stray
-- hyphens, and de-duplicate collisions with a numeric suffix. Empty results
-- (e.g. a name with no alphanumerics) fall back to a stable id-based slug.
WITH slugified AS (
  SELECT
    id,
    trim(BOTH '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')) AS base,
    row_number() OVER (
      PARTITION BY trim(BOTH '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
      ORDER BY "createdAt", id
    ) AS rn
  FROM "Workspace"
)
UPDATE "Workspace" w
SET "slug" = CASE
  WHEN s.base = '' THEN 'workspace-' || substr(w.id, 1, 8)
  WHEN s.rn = 1 THEN s.base
  ELSE s.base || '-' || s.rn::text
END
FROM slugified s
WHERE w.id = s.id;

-- Now enforce the constraints.
ALTER TABLE "Workspace" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
