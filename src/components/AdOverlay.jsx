import React from 'react';

/**
 * Runtime-safe ad overlay toggle.
 * Build-time env REACT_APP_SHOW_PLACEHOLDER_AD controls whether the placeholder renders.
 * In staging/production, set REACT_APP_SHOW_PLACEHOLDER_AD=false (or omit).
 */
export default function AdOverlay() {
  const show = process.env.REACT_APP_SHOW_PLACEHOLDER_AD === 'true';
  if (!show) return null;
  return (
    <div id="sponsored-overlay" className="sponsored-overlay">
      Sponsored by …
    </div>
  );
}
