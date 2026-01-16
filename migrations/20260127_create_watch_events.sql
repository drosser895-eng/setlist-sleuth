-- migrations/20260127_create_watch_events.sql
-- Creates watch_events table for tracking user viewing history and analytics
-- Enables personalization and watch history features for BlazeTV

CREATE TABLE IF NOT EXISTS watch_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    video_id INTEGER NOT NULL,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    event JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient user history queries
CREATE INDEX IF NOT EXISTS idx_watch_events_user_id ON watch_events(user_id);

-- Create index for video analytics queries
CREATE INDEX IF NOT EXISTS idx_watch_events_video_id ON watch_events(video_id);

-- Create composite index for user-video queries
CREATE INDEX IF NOT EXISTS idx_watch_events_user_video ON watch_events(user_id, video_id);

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_watch_events_created_at ON watch_events(created_at);

-- Create index for JSONB event data queries
CREATE INDEX IF NOT EXISTS idx_watch_events_event ON watch_events USING GIN(event);

-- Example usage:
-- INSERT INTO watch_events (user_id, video_id, watched_seconds, duration_seconds, event) 
-- VALUES ('user123', 1, 120, 300, '{"device":"mobile","quality":"720p","completed":false}');
--
-- Query watch history:
-- SELECT * FROM watch_events WHERE user_id = 'user123' ORDER BY created_at DESC LIMIT 10;
--
-- Query video analytics:
-- SELECT video_id, COUNT(*) as views, AVG(watched_seconds) as avg_watch_time 
-- FROM watch_events GROUP BY video_id ORDER BY views DESC;
