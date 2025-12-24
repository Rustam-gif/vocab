-- Table to cache AI-generated productivity articles (one row per day)
CREATE TABLE IF NOT EXISTS productivity_articles_cache (
  date_key TEXT PRIMARY KEY,  -- Format: YYYY-MM-DD
  articles JSONB NOT NULL,    -- Array of article objects
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_productivity_articles_generated_at
ON productivity_articles_cache(generated_at DESC);

-- Comment
COMMENT ON TABLE productivity_articles_cache IS 'Daily cache for AI-generated productivity articles';
