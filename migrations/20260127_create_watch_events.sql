-- migrations/20260127_create_watch_events.sql
CREATE TABLE IF NOT EXISTS watch_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  video_id INT REFERENCES videos(id),
  watched_seconds INT,
  duration_seconds INT,
  event_type VARCHAR(50), -- 'play', 'pause', 'complete'
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_watch_events_user ON watch_events(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_events_video ON watch_events(video_id);
