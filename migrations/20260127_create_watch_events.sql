-- migrations/20260127_create_watch_events.sql
-- Creates watch_events table for tracking user viewing history and engagement metrics.

CREATE TABLE IF NOT EXISTS watch_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    video_id VARCHAR(255) NOT NULL,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL,
    event JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_watch_events_video_id ON watch_events(video_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_user_id ON watch_events(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_created_at ON watch_events(created_at);
CREATE INDEX IF NOT EXISTS idx_watch_events_user_video ON watch_events(user_id, video_id);

-- Example usage:
-- INSERT INTO watch_events (user_id, video_id, watched_seconds, duration_seconds, event)
-- VALUES ('user123', 'video456', 180, 300, '{"session_id": "abc123", "platform": "web", "completed": false}');
