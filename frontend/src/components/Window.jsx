// A simple "application window" frame used by every page.
export default function Window({ title, children, actions }) {
  return (
    <main className="window" aria-labelledby="window-title">
      <header className="titlebar">
        <h1 id="window-title">{title}</h1>
        {actions}
      </header>
      <div className="window-body">{children}</div>
    </main>
  );
}
