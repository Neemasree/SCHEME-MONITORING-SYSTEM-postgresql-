-- Idempotent PostgreSQL schema upgrade for CivicTrack.
-- Existing base tables are expected; the migration runner bootstraps missing
-- tables from registered Sequelize models before executing this file.
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "Applications"
  ADD COLUMN IF NOT EXISTS "beneficiaryUserId" INTEGER
  REFERENCES "Users"("id") ON DELETE SET NULL;

ALTER TABLE "Notifications"
  ADD COLUMN IF NOT EXISTS "userId" INTEGER
  REFERENCES "Users"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "AuditLogs" (
  "id" BIGSERIAL PRIMARY KEY,
  "entityType" VARCHAR(50) NOT NULL,
  "entityId" INTEGER NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "actorId" INTEGER NOT NULL,
  "actorRole" VARCHAR(50) NOT NULL,
  "previousStatus" VARCHAR(50),
  "newStatus" VARCHAR(50),
  "remark" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AuditLogs_entity_created_idx"
  ON "AuditLogs" ("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLogs_actor_created_idx"
  ON "AuditLogs" ("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "Applications_beneficiary_date_idx"
  ON "Applications" ("beneficiaryUserId", "dateApplied");
