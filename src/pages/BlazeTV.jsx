import React, { useState } from 'react';
import VideoFeed from '../components/VideoFeed';
import AdOverlay from '../components/AdOverlay';

export default function BlazeTV() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="blazetv-page" style={{
      background: '#0a0a0a',
      minHeight: '100vh',
      color: '#fff',
      padding: '0 40px',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <header style={{ padding: '60px 0 40px', borderBottom: '1px solid #1f1f1f' }}>
        <h1 style={{
          margin: 0,
          fontSize: '3.5rem',
          fontWeight: '900',
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, #ff0055 0%, #ffcc00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitFillColor: 'transparent',
          marginBottom: '20px'
        }}>
          BlazeTV
        </h1>
        <div style={{ maxWidth: '600px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search verified videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '40px',
              border: '1px solid #333',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '1.1rem',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
            onFocus={(e) => e.target.style.border = '1px solid #ff0055'}
            onBlur={(e) => e.target.style.border = '1px solid #333'}
          />
        </div>
      </header>

      <main style={{ marginTop: '40px' }}>
        <VideoFeed search={searchTerm} />
      </main>

      <AdOverlay />

      <style>{`
        body { margin: 0; background: #0a0a0a; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
}