// src/spotify.js

export const searchTrack = async (trackName, artistName, token) => {
  if (!token) {
    console.error("No access token provided.");
    return null;
  }

  try {
    const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
    const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10&market=US`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Spotify search error', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    if (!data.tracks || !Array.isArray(data.tracks.items) || data.tracks.items.length === 0) {
      console.warn('No tracks found at all for:', `${artistName} - ${trackName}`);
      return null;
    }

    const items = data.tracks.items;
    
    const normalized = items.map(item => item.track ? item.track : item);
    const withPreview = normalized.find(t => !!t.preview_url);

    if (withPreview) {
      return withPreview;
    }

    console.warn(
      'Tracks found but none with preview_url for:',
      `${artistName} - ${trackName}`
    );
    return normalized[0];
  } catch (err) {
    console.error('Error in searchTrack for:', `${artistName} - ${trackName}`, err);
    return null;
  }
};

export const getDailySetlist = async () => {
  // This is now just a static list and doesn't require a token.
  // Kept for consistency in the game logic for now.
  const dailySetlist = [
    { artist: 'Queen', title: 'Bohemian Rhapsody' },
    { artist: 'Led Zeppelin', title: 'Stairway to Heaven' },
    { artist: 'Adele', title: 'Rolling in the Deep' },
    { artist: 'Ed Sheeran', title: 'Shape of You' },
    { artist: 'Billie Eilish', title: 'Bad Guy' },
    { artist: 'Harry Styles', title: 'Watermelon Sugar' },
    { artist: 'Dua Lipa', title: 'Levitating' },
    { artist: 'Olivia Rodrigo', title: 'Drivers License' },
    { artist: 'The Kid Laroi & Justin Bieber', 'title': 'Stay' },
    { artist: 'Glass Animals', title: 'Heat Waves' },
    { artist: 'Lil Nas X', title: 'Montero (Call Me By Your Name)' },
    { artist: 'Doja Cat', title: 'Kiss Me More (feat. SZA)' },
  ];
  return dailySetlist;
};
