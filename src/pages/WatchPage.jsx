import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HlsPlayer from '../components/HlsPlayer';
import AdOverlay from '../components/AdOverlay';

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch video details from API
    // fetch(`/api/blazetv/video/${id}`).then(...)
    setTimeout(() => {
        setVideo({
            id,
            title: "Sample Video",
            hls_url: "https://archive.org/download/prelinger/clip-1234/clip.m3u8",
            thumbnail_url: "https://archive.org/download/prelinger/clip-1234/thumb.jpg"
        });
        setLoading(false);
    }, 500);
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!video) return <div>Video not found</div>;

  return (
    <div className="watch-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>{video.title}</h1>
      <AdOverlay />
      <div className="player-wrapper" style={{ position: 'relative' }}>
        <HlsPlayer url={video.hls_url} poster={video.thumbnail_url} />
      </div>
    </div>
  );
}