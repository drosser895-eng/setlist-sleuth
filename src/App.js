import React, { useState, useEffect } from 'react';
import { searchTrack, getDailySetlist } from './spotify';
import gameThemes from './themes';
import ThemeSelector from './ThemeSelector';

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = window.location.origin.includes('localhost')
  ? 'https://localhost:3000'
  : 'https://drosser895-eng.github.io/setlist-sleuth/';
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";

const defaultSetlist = [];

const mainstreamMixBase = [
    { artist: 'Daft Punk', title: 'Get Lucky', preHint: 'This song features Pharrell Williams and Nile Rodgers.', secondaryHint: 'It won two Grammy awards in 2014.' },
    { artist: 'Adele', title: 'Rolling in the Deep', preHint: 'This song was a massive global hit in 2010.', secondaryHint: 'The title is an adaptation of the slang phrase "roll deep".' },
    { artist: 'Gotye', title: 'Somebody That I Used To Know', preHint: 'This song features Kimbra.', secondaryHint: 'The music video features the singers being gradually painted.'},
    { artist: 'Mark Ronson', title: 'Uptown Funk', preHint: 'This song features Bruno Mars.', secondaryHint: 'It spent 14 consecutive weeks at number one on the US Billboard Hot 100.'},
    { artist: 'Ed Sheeran', title: 'Shape of You', preHint: 'This was the best-performing song of 2017.', secondaryHint: 'It was originally written for another artist.'},
];

const getAppStyles = (activeThemeName, gameThemes) => {
  const theme = gameThemes[activeThemeName] || gameThemes.default;
  return `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap');
  .dj-booth { display: flex; justify-content: space-around; align-items: center; min-height: 100vh; padding: 20px; box-sizing: border-box; background: ${theme.background}; transition: background-color 0.3s ease; }
  .login-container { text-align: center; background-color: ${theme.mixerBackground}; padding: 50px; border-radius: 20px; box-shadow: 0 0 30px ${theme.mixerShadow}; }
  .login-button { display: inline-block; background-color: ${theme.buttonBackground}; color: ${theme.buttonColor}; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; text-decoration: none; text-transform: uppercase; }
  .login-button:hover { background-color: ${theme.buttonHoverBackground}; }
  .dj-booth.glitch { animation: glitch-effect 0.5s linear; }
  @keyframes glitch-effect { 0% { transform: translate(0); } 20% { transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } 100% { transform: translate(0); } }
  .turntable { flex: 1; max-width: 350px; min-height: 400px; background-color: ${theme.turntableBackground}; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 30px 0; box-shadow: 0 0 20px ${theme.turntableShadow}, inset 0 0 10px ${theme.turntableInsetShadow}; border: 2px solid ${theme.turntableBorder}; position: relative; overflow: hidden; margin: 0 20px; }
  .turntable h2 { font-family: 'Orbitron', sans-serif; color: ${theme.turntableHeaderColor}; text-shadow: 0 0 8px ${theme.turntableHeaderShadow}, 0 0 15px ${theme.turntableHeaderShadow}; margin-bottom: 20px; font-size: 1.5em; }
  .record-stack { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 80%; position: relative; z-index: 1; }
  .vinyl-record { width: 180px; height: 180px; background-color: ${theme.vinylRecordBackground}; border-radius: 50%; border: 5px solid ${theme.vinylRecordBorder}; box-shadow: 0 0 15px ${theme.vinylRecordShadow}, inset 0 0 8px ${theme.vinylRecordInsetShadow}; display: flex; align-items: center; justify-content: center; position: absolute; opacity: 0; animation: spin-in 0.8s forwards ease-out; transform-origin: center center; transition: all 0.3s ease; }
  .vinyl-record:nth-child(1) { z-index: 10; transform: translateY(0px) rotate(0deg); opacity: 1; }
  .vinyl-label { width: 60%; height: 60%; background-color: ${theme.vinylLabelBackground}; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: ${theme.vinylLabelColor}; font-size: 0.8em; text-align: center; border: 2px solid ${theme.vinylLabelBorder}; box-shadow: inset 0 0 5px ${theme.vinylLabelInsetShadow}; }
  .vinyl-label .artist { font-weight: bold; color: ${theme.artistColor}; text-shadow: 0 0 5px ${theme.artistShadow}; }
  .vinyl-label .title { font-style: italic; color: ${theme.titleColor}; text-shadow: 0 0 5px ${theme.titleShadow}; }
  .mixer { flex: 2; max-width: 600px; background-color: ${theme.mixerBackground}; border-radius: 20px; padding: 40px; box-shadow: 0 0 30px ${theme.mixerShadow}, inset 0 0 15px ${theme.mixerInsetShadow}; border: 2px solid ${theme.mixerBorder}; text-align: center; margin: 0 20px; }
  .game-title { font-family: 'Orbitron', sans-serif; font-size: 3em; color: ${theme.gameTitleColor}; text-shadow: 0 0 10px ${theme.gameTitleShadow}, 0 0 20px ${theme.gameTitleShadow}; margin-bottom: 20px; }
  .instructions { font-size: 1.1em; margin-bottom: 30px; color: ${theme.instructionsColor}; }
  .guess-form { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }
  .guess-input { width: 80%; padding: 15px; margin: 0 auto; background-color: ${theme.inputBackground}; border: 2px solid ${theme.inputBorder}; border-radius: 10px; color: ${theme.inputColor}; font-size: 1.1em; text-align: center; box-shadow: 0 0 10px ${theme.inputShadow}; outline: none; transition: all 0.3s ease; }
  .guess-button { background-color: ${theme.buttonBackground}; color: ${theme.buttonColor}; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; box-shadow: 0 0 15px ${theme.buttonShadow}; transition: all 0.3s ease; text-transform: uppercase; }
  .counters { display: flex; justify-content: space-around; margin-bottom: 20px; }
  .guesses-counter, .found-counter { font-size: 1.1em; color: ${theme.counterColor}; }
  .game-over-message h2 { font-family: 'Orbitron', sans-serif; font-size: 2.5em; margin-bottom: 20px; }
  .support-buttons { margin-top: 30px; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
  .edit-button { background-color: transparent; color: ${theme.supportButtonColor}; border: 2px solid ${theme.supportButtonBorder}; padding: 10px 20px; border-radius: 8px; font-size: 1em; font-weight: bold; cursor: pointer; }
  `;
};

const LeaderboardModal = ({ leaderboard, onClose }) => (
  <div className="leaderboard-modal">
    <div className="leaderboard-content">
      <button onClick={onClose} className="leaderboard-close">&times;</button>
      <h2>Leaderboard</h2>
      {leaderboard.length === 0 ? <p>No scores yet!</p> : (
        <ol className="leaderboard-list">
          {leaderboard.map((entry, index) => <li key={index} className="leaderboard-entry"><span>{entry.name}</span><span>{entry.score}</span></li>)}
        </ol>
      )}
    </div>
  </div>
);

function App() {
  const [token, setToken] = useState("");
  const [initialSetlist, setInitialSetlist] = useState(defaultSetlist);
  const [foundTracks, setFoundTracks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [guessesRemaining, setGuessesRemaining] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameMode, setGameMode] = useState('mainstream-mix-untimed');
  const [activeThemeName, setActiveThemeName] = useState('default');
  const [nextTrackToGuess, setNextTrackToGuess] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    let token = window.localStorage.getItem("token");
    const hash = window.location.hash;

    if (!token && hash) {
        const match = hash.match(/access_token=([^&]*)/);
        if (match) {
            token = match[1];
            window.localStorage.setItem("token", token);
            window.location.hash = ""; // Clear the hash from the URL
        }
    }
    
    setToken(token);
  }, []);

  const buildMainstreamMixSetlist = async (accessToken) => {
    const playableTracks = [];
    for (const item of mainstreamMixBase) {
      const spotifyTrack = await searchTrack(item.title, item.artist, accessToken);
      if (spotifyTrack && spotifyTrack.preview_url) {
        playableTracks.push({ ...item, spotifyTrack, preview_url: spotifyTrack.preview_url });
      } else {
        console.warn(`Skipping: ${item.artist} - ${item.title}`);
      }
    }
    return playableTracks;
  };

  useEffect(() => {
    if (!token) return;

    const fetchAndSetSetlist = async () => {
      let currentSetlist = [];
      if (gameMode === 'mainstream-mix-untimed') {
        currentSetlist = await buildMainstreamMixSetlist(token);
      } else {
        currentSetlist = await getDailySetlist();
      }

      if (currentSetlist && currentSetlist.length > 0) {
        setInitialSetlist(currentSetlist);
        setNextTrackToGuess(currentSetlist[0]);
        setFoundTracks([]);
        setGuessesRemaining(10);
        setGameOver(false);
        setGameWon(false);
      } else {
        alert('Could not build a playable setlist. Please try a different mode.');
      }
    };

    fetchAndSetSetlist();
  }, [gameMode, token]);

  const handleLogout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  const handleGuessSubmit = (event) => {
    event.preventDefault();
    if (gameOver) return;

    const normalizedInput = inputValue.toLowerCase().trim();
    const isCorrect = nextTrackToGuess.title.toLowerCase() === normalizedInput || nextTrackToGuess.artist.toLowerCase() === normalizedInput;

    if (isCorrect) {
      const newFoundTracks = [...foundTracks, nextTrackToGuess];
      setFoundTracks(newFoundTracks);
      
      if (currentAudio) currentAudio.pause();
      const audio = new Audio(nextTrackToGuess.preview_url);
      audio.play();
      setCurrentAudio(audio);

      const nextIndex = initialSetlist.findIndex(t => t.title === nextTrackToGuess.title) + 1;
      if (nextIndex < initialSetlist.length) {
        setNextTrackToGuess(initialSetlist[nextIndex]);
      } else {
        setGameWon(true);
        setGameOver(true);
      }
    } else {
      setGuessesRemaining(guessesRemaining - 1);
      if (guessesRemaining - 1 <= 0) {
        setGameOver(true);
      }
    }
    setInputValue('');
  };

  if (!token) {
    return (
      <>
        <style>{getAppStyles('default', gameThemes)}</style>
        <div className="dj-booth">
          <div className="login-container">
            <h1 className="game-title">Welcome to Setlist Sleuth</h1>
            <p className="instructions">Please log in with Spotify to continue.</p>
            <a className="login-button" href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private`}>
              Login with Spotify
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{getAppStyles(activeThemeName, gameThemes)}</style>
      <div className="dj-booth">
        <div className="turntable left">
          <h2>Found Tracks</h2>
          <div className="record-stack">
            {foundTracks.map((track, index) => (
              <div key={index} className="vinyl-record">
                <div className="vinyl-label">
                  <span className="artist">{track.artist}</span>
                  <span className="title">{track.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mixer">
          <h1 className="game-title">DJ Blaze's Setlist Sleuth</h1>
          {nextTrackToGuess && !gameOver && (
            <p className="instructions">
              A new song is playing! Guess the artist or title.
            </p>
          )}
          {gameOver && (
            <div className="game-over-message">
              <h2>{gameWon ? 'You Guessed All The Songs!' : 'Game Over!'}</h2>
            </div>
          )}
          {!gameOver && (
            <form onSubmit={handleGuessSubmit} className="guess-form">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Your guess..."
                className="guess-input"
              />
              <button type="submit" className="guess-button">Submit Guess</button>
            </form>
          )}
          <div className="counters">
            <p className="guesses-counter">Guesses Remaining: {guessesRemaining}</p>
            <p className="found-counter">Tracks Found: {foundTracks.length} / {initialSetlist.length}</p>
          </div>
          <div className="support-buttons">
            <button onClick={handleLogout} className="edit-button">Logout</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;