const storageKey = 'muse-theme';

export function readThemePreference() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // The theme still works when browser storage is unavailable.
  }
  return 'system';
}

export function saveThemePreference(preference) {
  try {
    if (preference === 'system') localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, preference);
  } catch {
    // Keep the choice for this session even if it cannot be saved.
  }
}

export function applyTheme(preference) {
  const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme =
    preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference;
}

export function isThemeStorageEvent(event) {
  return event.storageArea === localStorage && (event.key === storageKey || event.key === null);
}
