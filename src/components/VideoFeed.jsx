import React, { useEffect, useRef, useState, useCallback } from 'react';
import VideoCard from './VideoCard';

export default function VideoFeed({ channelId, search }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observer = useRef();

  // Reset feed when search or channel changes
  useEffect(() => {
    setVideos([]);
    setOffset(0);
    setHasMore(true);
  }, [search, channelId]);

  const lastVideoRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prev => prev + 12);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          offset: offset.toString(),
          limit: '12'
        });
        if (channelId) queryParams.append('channelId', channelId);
        if (search) queryParams.append('search', search);

        const res = await fetch(`/api/blazetv/feed?${queryParams.toString()}`);
        const data = await res.json();

        setVideos(prev => offset === 0 ? data : [...prev, ...data]);
        setHasMore(data.length === 12);
      } catch (err) {
        console.error('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [offset, channelId, search]);

  return (
    <div className="discovery-feed">
      {videos.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#666' }}>
          <p style={{ fontSize: '1.2rem' }}>No videos found matching your search.</p>
        </div>
      ) : (
        <div
          className="video-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '32px',
            paddingBottom: '60px'
          }}
        >
          {videos.map((video, index) => (
            <div key={`${video.id}-${index}-${offset}`} ref={index === videos.length - 1 ? lastVideoRef : null}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,0,85,0.1)',
            borderTop: '4px solid #ff0055',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}