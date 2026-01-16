import React from 'react';

export default function VideoCard({ video }) {
  const { title, thumbnail_url, channel_name, created_at } = video;

  return (
    <div className="video-card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
      <div
        className="thumbnail-container"
        style={{
          width: '100%',
          aspectRatio: '16/9',
          background: '#111',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        <img
          src={thumbnail_url || 'https://via.placeholder.com/320x180?text=No+Thumbnail'}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>
      <div className="video-info">
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#fff' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>{channel_name}</p>
        {created_at && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
            {new Date(created_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
