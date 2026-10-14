import ThemeButton from './ThemeButton.jsx';

// A simple "application window" frame used by every page.
export default function Window({ title, children, actions, className = '' }) {
  return (
    <main className={`window ${className}`.trim()} aria-labelledby="window-title">
      <header className="titlebar">
        <h1 id="window-title">{title}</h1>
        <div className="titlebar-actions">
          <ThemeButton />
          {actions}
        </div>
      </header>
      <div className="window-body">{children}</div>
    </main>
  );
}
