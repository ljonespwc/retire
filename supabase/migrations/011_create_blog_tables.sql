-- Create blog tables for article management and engagement

-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL, -- Stores markdown content
  featured_image_url TEXT, -- Optional featured image from Supabase Storage
  cta_text TEXT, -- Dynamic CTA text per article (nullable for default)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  publish_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reading_time_minutes INTEGER -- Calculated from content length
);

-- Article likes table (aggregate like counts per article)
CREATE TABLE IF NOT EXISTS public.article_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_article_likes UNIQUE(article_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status_publish_date ON public.articles(status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON public.article_likes(article_id);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles table

-- Public can read published articles only
CREATE POLICY "Public can read published articles"
  ON public.articles
  FOR SELECT
  USING (status = 'published');

-- Authenticated user (lance.jones@precisionnutrition.com) can read all articles
CREATE POLICY "Admin can read all articles"
  ON public.articles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND auth.jwt()->>'email' = 'lance.jones@precisionnutrition.com'
  );

-- Admin can insert articles
CREATE POLICY "Admin can insert articles"
  ON public.articles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.jwt()->>'email' = 'lance.jones@precisionnutrition.com'
  );

-- Admin can update articles
CREATE POLICY "Admin can update articles"
  ON public.articles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND auth.jwt()->>'email' = 'lance.jones@precisionnutrition.com'
  );

-- Admin can delete articles (soft delete via archive status preferred)
CREATE POLICY "Admin can delete articles"
  ON public.articles
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND auth.jwt()->>'email' = 'lance.jones@precisionnutrition.com'
  );

-- RLS Policies for article_likes table

-- Public can read all like counts
CREATE POLICY "Public can read article likes"
  ON public.article_likes
  FOR SELECT
  USING (true);

-- Public can update like counts (application logic handles rate limiting)
CREATE POLICY "Public can update article likes"
  ON public.article_likes
  FOR UPDATE
  USING (true);

-- Public can insert initial like records (when article is first liked)
CREATE POLICY "Public can insert article likes"
  ON public.article_likes
  FOR INSERT
  WITH CHECK (true);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_likes_updated_at
  BEFORE UPDATE ON public.article_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
