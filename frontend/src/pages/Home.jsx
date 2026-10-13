import { useAuth } from '../context/AuthContext.jsx';
import Window from '../components/Window.jsx';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <Window
      title="Muse"
      className="journal-window"
      actions={<button className="titlebar-btn" onClick={logout}>Log out</button>}
    >
      <section className="journal-content" aria-labelledby="journal-heading">
        <header className="journal-header">
          <h2 id="journal-heading">Journal entries</h2>
          <p className="muted">A space for your thoughts and memories.</p>
        </header>
        <div className="journal-empty">
          <h3>No journal entries yet</h3>
          <p className="muted">Your entries will appear here.</p>
        </div>
      </section>
      <footer className="journal-footer">
        Signed in as <strong>{user.username}</strong>.
      </footer>
    </Window>
  );
}
