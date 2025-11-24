// discoverPlayableTracks.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const getAccessToken = async () => {
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Spotify API credentials are not set in the .env file.");
    return null;
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

const getPlaylistTracks = async (playlistId, accessToken) => {
  try {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('Spotify playlist error', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.items; // The items array contains the track objects
  } catch (err) {
    console.error('Error in getPlaylistTracks:', err);
    return null;
  }
};


// --- DISCOVERY LOGIC ---

const discoverFromPlaylist = async () => {
  console.log('Starting discovery from public playlist...');
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log('Could not get access token. Aborting.');
    return;
  }

  // ID for Spotify's "Today's Top Hits" playlist
  const playlistId = '37i9dQZF1DXcBWXoPEgAc5';
  console.log(`
--- Fetching tracks from playlist: ${playlistId} ---`);
  
  const tracks = await getPlaylistTracks(playlistId, accessToken);

  if (tracks && tracks.length > 0) {
    tracks.forEach((item, index) => {
      const track = item.track; // In playlist responses, the track object is nested under `track`
      if (track) {
        const hasPreview = !!track.preview_url;
        console.log(
          `  [Track ${index + 1}] "${track.name}" by ${track.artists.map(a => a.name).join(', ')} - PREVIEW: ${hasPreview ? 'YES' : 'NO'}`
        );
      } else {
        console.log(`  [Item ${index + 1}] is not a valid track object.`);
      }
    });
  } else {
    console.log('  No tracks found in the playlist.');
  }
};

discoverFromPlaylist();