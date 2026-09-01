-- Keep browser history short-lived while retaining screenshots for QA review.
-- Screenshot storage objects are removed by the Edge Function before DB rows are deleted.

CREATE INDEX IF NOT EXISTS idx_browser_history_visited_at
ON public.browser_history (visited_at);

CREATE INDEX IF NOT EXISTS idx_screenshots_taken_at_retention
ON public.screenshots (taken_at);

CREATE OR REPLACE FUNCTION public.cleanup_monitoring_artifacts_retention()
RETURNS TABLE(deleted_screenshots integer, deleted_browser_history integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  screenshot_count integer := 0;
  history_count integer := 0;
BEGIN
  DELETE FROM public.screenshots
  WHERE taken_at < (NOW() - INTERVAL '15 days');
  GET DIAGNOSTICS screenshot_count = ROW_COUNT;

  DELETE FROM public.browser_history
  WHERE visited_at < (NOW() - INTERVAL '24 hours');
  GET DIAGNOSTICS history_count = ROW_COUNT;

  RETURN QUERY SELECT screenshot_count, history_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_screenshots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.screenshots
  WHERE taken_at < (NOW() - INTERVAL '15 days');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
