-- Add HR Manager role with the same privileges as ADMIN in application code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
      AND e.enumlabel = 'HR_MANAGER'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'HR_MANAGER';
  END IF;
END $$;
