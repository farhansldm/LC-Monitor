-- Manager annotations on work sessions (Day 4)
ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS manager_comment text;
