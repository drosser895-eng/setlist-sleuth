-- migrations/20260127_add_analytics_tables.sql
CREATE TABLE IF NOT EXISTS watch_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  video_id INT REFERENCES videos(id),
  watched_seconds INT DEFAULT 0,
  duration_seconds INT,
  event_type VARCHAR(50), -- play_start, progress, complete
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_watch_events_video ON watch_events(video_id);
CREATE INDEX idx_watch_events_user ON watch_events(user_id);
