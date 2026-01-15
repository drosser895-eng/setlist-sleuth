-- migrations/20260115_add_payment_links.sql
-- Adds payment_links JSONB field to users (artists) table
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_links jsonb DEFAULT '{}'::jsonb;

-- Example usage:
-- UPDATE users SET payment_links = '{"paypal":"https://www.paypal.me/Artist","kofi":"https://ko-fi.com/Artist"}' WHERE id = '<user-uuid>';
