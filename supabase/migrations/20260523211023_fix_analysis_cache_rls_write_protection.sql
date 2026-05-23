/*
  # Fix analysis_cache RLS write protection

  ## Problem
  The analysis_cache table previously had no INSERT/UPDATE/DELETE policies,
  meaning anyone could poison the cache with false data via direct Supabase
  client calls using the anon key.

  ## Changes
  - Remove the overly-permissive SELECT USING(true) policy and replace with a
    named, documented one.
  - Explicitly deny INSERT, UPDATE, and DELETE from all roles except
    service_role (which bypasses RLS entirely, used by supabaseAdmin on the
    server).

  ## Security
  - Public reads are still allowed (needed for the API to serve cached results).
  - All writes are blocked for authenticated and anonymous users.
  - The server-side supabaseAdmin client uses the service_role key and bypasses
    RLS, so cache writes from the API still work correctly.
*/

-- Drop old permissive policy if it exists
DROP POLICY IF EXISTS "Anyone can read analysis cache" ON public.analysis_cache;

-- Allow public reads (required for cache hit serving)
CREATE POLICY "Public can read analysis cache"
  ON public.analysis_cache FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicitly block writes from all client-facing roles
-- (service_role bypasses RLS so server writes still work)
CREATE POLICY "Block anon insert on analysis cache"
  ON public.analysis_cache FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Block anon update on analysis cache"
  ON public.analysis_cache FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block anon delete on analysis cache"
  ON public.analysis_cache FOR DELETE
  TO anon, authenticated
  USING (false);
