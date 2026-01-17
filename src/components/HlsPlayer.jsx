import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ url }) {
  const videoRef = useRef();

  useEffect(() => {
    const v = videoRef.current;
    if (!url) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(v);
      return () => hls.destroy();
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      // native HLS (Safari)
      v.src = url;
    }
  }, [url]);

  const recordEvent = async (eventType, metadata = {}) => {
    try {
      await fetch('/api/analytics/watch-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: url, // Simplified: using URL as temp ID
          event_type: eventType,
          watched_seconds: videoRef.current ? Math.floor(videoRef.current.currentTime) : 0,
          duration_seconds: videoRef.current ? Math.floor(videoRef.current.duration) : 0,
          metadata
        })
      });
    } catch (err) {
      console.error('Failed to record analytics:', err);
    }
  };

  const onPlay = () => {
    // Hide intrusive overlays when playback starts
    document.querySelectorAll('.ad-overlay, .sponsored-overlay').forEach((el) => {
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    });
    recordEvent('play_start');
  };

  const onEnded = () => recordEvent('play_complete');

  // Track progress every 10 seconds
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (v && Math.floor(v.currentTime) % 10 === 0 && v.currentTime > 0) {
      recordEvent('progress');
    }
  };

  return (
    <video
      ref={videoRef}
      controls
      onPlay={onPlay}
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
    />
  );
}
