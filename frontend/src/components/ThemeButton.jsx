import { useTheme } from '../context/ThemeContext.jsx';

const themes = ['system', 'light', 'dark'];
const labels = { system: 'System', light: 'Light', dark: 'Dark' };

export default function ThemeButton() {
  const { preference, changeTheme } = useTheme();
  const next = themes[(themes.indexOf(preference) + 1) % themes.length];
  const description = `Color theme: ${labels[preference]}. Switch to ${labels[next]}.`;

  return (
    <button
      type="button"
      className="titlebar-btn theme-button"
      aria-label={description}
      title={description}
      onClick={() => changeTheme(next)}
    >
      {labels[preference]}
    </button>
  );
}
