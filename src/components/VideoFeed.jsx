import React, { useEffect, useState } from 'react';
import VideoCard from './VideoCard';

/*
  VideoFeed fetches /api/blazetv/feed and implements simple list rendering.
  In a real app, use IntersectionObserver for infinite scroll.
*/
export default function VideoFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In real app: fetch('/api/blazetv/feed')
    // Mock data for initial render
    setTimeout(() => {
      setVideos([
        {
          id: 1,
          title: "Vintage Music Clip (Public Domain)",
          thumbnail_url: "https://archive.org/download/prelinger/clip-1234/thumb.jpg", // Placeholder
          hls_url: "https://archive.org/download/prelinger/clip-1234/clip.m3u8", // Placeholder
          channel_name: "Prelinger Archives",
          created_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div>Loading Blaze TV...</div>;
  if (error) return <div>Error loading feed.</div>;

  return (
    <div className="video-feed" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {videos.map(v => <VideoCard key={v.id} video={v} />)}
    </div>
  );
}