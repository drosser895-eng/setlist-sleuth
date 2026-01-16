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

  const onPlay = () => {
    // Hide intrusive overlays when playback starts
    document.querySelectorAll('.ad-overlay, .sponsored-overlay').forEach((el) => {
      el.style.display = 'none';
    });
  };

  return (
    <video
      ref={videoRef}
      controls
      onPlay={onPlay}
      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
    />
  );
}
