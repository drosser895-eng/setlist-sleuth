// 1) State declarations
const [unlockedThemes, setUnlockedThemes] = useState(() => {
  const savedThemes = localStorage.getItem('unlockedThemes');
  return savedThemes ? JSON.parse(savedThemes) : ['Default'];
});

const [activeThemeName, setActiveThemeName] = useState(() => {
  const savedTheme = localStorage.getItem('activeThemeName');
  return savedTheme || 'Default';
});

useEffect(() => {
  localStorage.setItem('unlockedThemes', JSON.stringify(unlockedThemes));
}, [unlockedThemes]);

useEffect(() => {
  localStorage.setItem('activeThemeName', activeThemeName);
}, [activeThemeName]);

// 2) Import ThemeSelector
import ThemeSelector from './ThemeSelector';

// 3) Render <ThemeSelector /> in JSX
<ThemeSelector
  unlockedThemes={unlockedThemes}
  activeThemeName={activeThemeName}
  onThemeChange={setActiveThemeName}
/>

// 4) Leaderboard useEffect example
useEffect(() => {
  if (!leaderboard || leaderboard.length === 0) return;
  const highestScore = leaderboard[0].score;
  const updated = new Set(unlockedThemes);

  if (highestScore >= 50) updated.add('Bronze');
  if (highestScore >= 100) updated.add('Silver');
  if (highestScore >= 200) updated.add('Gold');

  const updatedArray = Array.from(updated);
  if (updatedArray.length !== unlockedThemes.length) {
    setUnlockedThemes(updatedArray);
  }
}, [leaderboard, unlockedThemes]);

// 5) Dynamic styles based on active theme
const themeStyles = {
  Default: { '--app-bg': '#050816', '--app-text': '#ffffff' },
  Bronze: { '--app-bg': '#2b1b12', '--app-text': '#f5e0c3' },
  Silver: { '--app-bg': '#1c1f26', '--app-text': '#e3e7ef' },
  Gold: { '--app-bg': '#231600', '--app-text': '#ffe9a3' },
};

const activeTheme = themeStyles[activeThemeName] || themeStyles.Default;

<div className="App" style={activeTheme}>
  {/* existing content */}
</div>
