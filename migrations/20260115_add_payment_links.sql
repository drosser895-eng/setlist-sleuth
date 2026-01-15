ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_links jsonb DEFAULT '{}'::jsonb;
