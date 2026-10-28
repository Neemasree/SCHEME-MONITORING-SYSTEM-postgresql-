-- Disposable CI fixture representing the core schema before the 20261011 upgrade.
-- This file is run only against the separately-created govt_monitoring_legacy database.
DO $$
BEGIN
  CREATE TYPE "enum_Users_role" AS ENUM (
    'admin', 'district_officer', 'field_officer', 'beneficiary'
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

CREATE TABLE "Users" (
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

CREATE TABLE "Schemes" (
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

CREATE TABLE "Applications" (
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

CREATE TABLE "Notifications" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(255) DEFAULT 'info',
  "isRead" BOOLEAN DEFAULT FALSE,
  "role" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

INSERT INTO "Users"
  ("name", "email", "password", "role", "district", "createdAt", "updatedAt")
VALUES
  ('Legacy CI User', 'legacy-ci@example.test', 'test-only-hash-placeholder',
   'beneficiary', NULL, NOW(), NOW());

INSERT INTO "Schemes"
  ("schemeName", "description", "budget", "district", "startDate", "endDate",
   "status", "beneficiariesCount", "createdAt", "updatedAt")
VALUES
  ('Legacy CI Scheme', 'Disposable migration compatibility fixture', '1000',
   'Salem', CURRENT_DATE, CURRENT_DATE + 30, 'Active', 1, NOW(), NOW());

INSERT INTO "Applications"
  ("beneficiary", "scheme", "district", "status", "dateApplied", "remarks",
   "createdAt", "updatedAt")
VALUES
  ('Legacy CI Beneficiary', 'Legacy CI Scheme', 'Salem',
   'Pending Field Officer', CURRENT_DATE, '[]'::jsonb, NOW(), NOW());

INSERT INTO "Notifications"
  ("title", "message", "type", "isRead", "role", "createdAt", "updatedAt")
VALUES
  ('Legacy CI Notification', 'Must survive the schema upgrade', 'info', FALSE,
   'admin', NOW(), NOW());
