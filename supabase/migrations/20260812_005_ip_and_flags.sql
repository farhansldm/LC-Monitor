-- IP / WFH classification + late/early flags on work sessions
ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS login_type text,
  ADD COLUMN IF NOT EXISTS late_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_flag boolean NOT NULL DEFAULT false;

-- login_type constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_sessions_login_type_check'
  ) THEN
    ALTER TABLE public.work_sessions
      ADD CONSTRAINT work_sessions_login_type_check
      CHECK (login_type IS NULL OR login_type IN ('WFH', 'SITE'));
  END IF;
END $$;

-- Trusted office IP ranges (admin-configurable)
CREATE TABLE IF NOT EXISTS public.office_ip_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.office_ip_ranges DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_work_sessions_login_type ON public.work_sessions(login_type);
CREATE INDEX IF NOT EXISTS idx_work_sessions_late_flag ON public.work_sessions(late_flag);
