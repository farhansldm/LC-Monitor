-- Attendance corrections: allow reason-only requests (no clock times required)
ALTER TABLE public.attendance_corrections
  ALTER COLUMN requested_in DROP NOT NULL,
  ALTER COLUMN requested_out DROP NOT NULL;

ALTER TABLE public.attendance_corrections
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
