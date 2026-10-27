-- Baseline schema for fresh CivicTrack PostgreSQL databases.
-- Keep this migration additive: never drop or rewrite existing application data.
-- Newer fields and the audit log are added by 20261011_schema_upgrade.sql.

DO $$
BEGIN
  CREATE TYPE "enum_Users_role" AS ENUM (
    'admin',
    'district_officer',
    'field_officer',
    'beneficiary'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "enum_Applications_status" AS ENUM (
    'Submitted',
    'Pending Field Officer',
    'Pending District Officer',
    'Pending Admin',
    'Approved',
    'Rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" "enum_Users_role" NOT NULL DEFAULT 'beneficiary',
  "district" VARCHAR(100),
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Users_email_key" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "Schemes" (
  "id" SERIAL PRIMARY KEY,
  "schemeName" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "budget" VARCHAR(255),
  "district" VARCHAR(255),
  "startDate" DATE,
  "endDate" DATE,
  "status" VARCHAR(255) DEFAULT 'Active',
  "beneficiariesCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "Applications" (
  "id" SERIAL PRIMARY KEY,
  "beneficiary" VARCHAR(150) NOT NULL,
  "scheme" VARCHAR(200) NOT NULL,
  "district" VARCHAR(100) NOT NULL,
  "status" "enum_Applications_status" NOT NULL DEFAULT 'Pending Field Officer',
  "dateApplied" DATE NOT NULL,
  "remarks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "Notifications" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(255) DEFAULT 'info',
  "isRead" BOOLEAN DEFAULT FALSE,
  "role" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS "Applications_status"
  ON "Applications" ("status");
CREATE INDEX IF NOT EXISTS "Applications_district_status"
  ON "Applications" ("district", "status");
CREATE INDEX IF NOT EXISTS "Applications_dateApplied"
  ON "Applications" ("dateApplied");
