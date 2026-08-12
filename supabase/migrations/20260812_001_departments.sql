-- Departments + user department link
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);

-- monitor_token already exists (uuid) from earlier migration; skip recreating

ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
