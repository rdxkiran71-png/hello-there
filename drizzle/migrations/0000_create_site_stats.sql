CREATE TABLE public.site_stats (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_requests bigint NOT NULL DEFAULT 0,
  today_requests bigint NOT NULL DEFAULT 0,
  today_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  total_viewers bigint NOT NULL DEFAULT 0
);
GRANT ALL ON public.site_stats TO service_role;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

INSERT INTO public.site_stats (id) VALUES (1);

CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS TABLE (total_requests bigint, today_requests bigint, total_viewers bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.total_requests,
         CASE WHEN s.today_date = (now() AT TIME ZONE 'utc')::date THEN s.today_requests ELSE 0 END,
         s.total_viewers
  FROM public.site_stats s WHERE s.id = 1
$$;

CREATE OR REPLACE FUNCTION public.bump_site_request()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.site_stats SET
    total_requests = total_requests + 1,
    today_requests = CASE WHEN today_date = (now() AT TIME ZONE 'utc')::date THEN today_requests + 1 ELSE 1 END,
    today_date = (now() AT TIME ZONE 'utc')::date
  WHERE id = 1
$$;

CREATE OR REPLACE FUNCTION public.bump_site_viewer()
RETURNS TABLE (total_requests bigint, today_requests bigint, total_viewers bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.site_stats SET total_viewers = total_viewers + 1 WHERE id = 1;
  SELECT * FROM public.get_site_stats();
$$;

REVOKE ALL ON FUNCTION public.get_site_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bump_site_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bump_site_viewer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_site_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bump_site_request() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bump_site_viewer() TO anon, authenticated, service_role;