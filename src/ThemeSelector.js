function ThemeSelector({ unlockedThemes, activeThemeName, onThemeChange }) {
  return (
    <div className="theme-selector">
      <h3>Theme</h3>
      <div className="theme-selector-buttons">
        {unlockedThemes.map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => onThemeChange(theme)} 
            className={theme === activeThemeName ? 'theme-button active' : 'theme-button'}
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeSelector;
