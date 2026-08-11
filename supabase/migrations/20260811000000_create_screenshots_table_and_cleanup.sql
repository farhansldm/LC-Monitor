-- Create screenshots table if not exists
CREATE TABLE IF NOT EXISTS public.screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_blurred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance when querying user screenshots by date and filtering by timestamp
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON public.screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_taken_at ON public.screenshots(taken_at);

-- Enable RLS
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins can view all screenshots" ON public.screenshots;
CREATE POLICY "Admins can view all screenshots"
    ON public.screenshots FOR SELECT
    USING (auth.jwt() ->> 'role' = 'ADMIN');

DROP POLICY IF EXISTS "Users can insert their own screenshots" ON public.screenshots;
CREATE POLICY "Users can insert their own screenshots"
    ON public.screenshots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own screenshots" ON public.screenshots;
CREATE POLICY "Users can view their own screenshots"
    ON public.screenshots FOR SELECT
    USING (auth.uid() = user_id);

-- Ensure storage bucket 'screenshots' exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Cleanup function to delete screenshots older than 15 days according to date and time
CREATE OR REPLACE FUNCTION public.cleanup_old_screenshots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete records older than 15 days based on taken_at timestamp
    DELETE FROM public.screenshots
    WHERE taken_at < (NOW() - INTERVAL '15 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
