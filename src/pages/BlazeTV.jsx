import React from 'react';
import VideoFeed from '../components/VideoFeed';
import AdOverlay from '../components/AdOverlay';

/*
  BlazeTV page. Add route in your router: /blazetv -> BlazeTV component.
*/
export default function BlazeTV() {
  return (
    <div className="blaze-tv-page">
      <h1>Blaze TV</h1>
      <AdOverlay />
      <VideoFeed />
    </div>
  );
}