import React from 'react';

export default function RealMoneyBanner() {
  const enabled = process.env.REACT_APP_REAL_MONEY_ENABLED === 'true';
  if (enabled) return null;
  return (
    <div style={{
      background: '#fff3cd',
      color: '#664d03',
      padding: '8px 12px',
      textAlign: 'center',
      borderBottom: '1px solid #ffeeba'
    }}>
      Real‑money play and cashouts are temporarily disabled while we finalize compliance. Artists accept tips directly via their profile links.
    </div>
  );
}
