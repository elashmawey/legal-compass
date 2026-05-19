CREATE TABLE public.legal_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  law_type TEXT NOT NULL,
  article_number TEXT NOT NULL,
  article_text TEXT NOT NULL,
  source_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (law_type, article_number)
);

CREATE INDEX idx_legal_articles_law_type ON public.legal_articles(law_type);

ALTER TABLE public.legal_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read legal articles"
  ON public.legal_articles
  FOR SELECT
  USING (true);