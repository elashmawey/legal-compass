CREATE TABLE public.analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL,
  cache_key text NOT NULL,
  result jsonb NOT NULL,
  hit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mode, cache_key)
);

ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read analysis cache"
  ON public.analysis_cache FOR SELECT
  USING (true);

CREATE INDEX idx_analysis_cache_lookup ON public.analysis_cache (mode, cache_key);