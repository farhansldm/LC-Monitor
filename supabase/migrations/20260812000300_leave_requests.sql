-- Leave requests (reuse existing correction_status enum: PENDING / APPROVED / REJECTED)
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text NOT NULL,
  status public.correction_status NOT NULL DEFAULT 'PENDING',
  reviewer_id uuid REFERENCES public.users(id),
  reviewer_comment text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date ON public.leave_requests(date);

ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
