-- Assertions run only against the disposable legacy-schema CI database.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'isActive'
  ) THEN
    RAISE EXCEPTION 'Upgrade did not add Users.isActive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Applications' AND column_name = 'beneficiaryUserId'
  ) THEN
    RAISE EXCEPTION 'Upgrade did not add Applications.beneficiaryUserId';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Notifications' AND column_name = 'userId'
  ) THEN
    RAISE EXCEPTION 'Upgrade did not add Notifications.userId';
  END IF;

  IF to_regclass('public."AuditLogs"') IS NULL THEN
    RAISE EXCEPTION 'Upgrade did not create AuditLogs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "Users"
    WHERE "email" = 'legacy-ci@example.test' AND "isActive" IS TRUE
  ) THEN
    RAISE EXCEPTION 'Legacy user data was not preserved or isActive was not defaulted';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "Schemes" WHERE "schemeName" = 'Legacy CI Scheme'
  ) THEN
    RAISE EXCEPTION 'Legacy scheme data was not preserved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "Applications"
    WHERE "beneficiary" = 'Legacy CI Beneficiary' AND "beneficiaryUserId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Legacy application data was not preserved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "Notifications"
    WHERE "title" = 'Legacy CI Notification' AND "userId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Legacy notification data was not preserved';
  END IF;
END $$;
