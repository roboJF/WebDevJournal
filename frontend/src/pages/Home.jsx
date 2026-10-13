import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import Window from '../components/Window.jsx';
import { formatEntryDate, previewEntryContent } from '../utils/entries.js';

export default function Home() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .entries()
      .then((data) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, loadAttempt]);

  return (
    <Window
      title="Muse"
      className="journal-window"
      actions={
        <button className="titlebar-btn" onClick={logout}>
          Log out
        </button>
      }
    >
      <section className="journal-content" aria-labelledby="journal-heading">
        <header className="journal-header">
          <div>
            <h2 id="journal-heading">Journal entries</h2>
            <p className="muted">A space for your thoughts and memories.</p>
          </div>
          <Link className="button-link" to="/entries/new">
            New entry
          </Link>
        </header>
        {loading ? (
          <p className="loading" role="status">
            Loading journal entries…
          </p>
        ) : loadError ? (
          <div className="alert" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              Try again
            </button>
          </div>
        ) : entries.length ? (
          <div className="journal-list">
            {entries.map((entry) => (
              <Link
                className="journal-entry entry-preview"
                key={entry.id}
                to={`/entries/${entry.id}`}
              >
                <header>
                  <h3>{entry.title}</h3>
                  <time className="muted" dateTime={entry.date}>
                    {formatEntryDate(entry.date)}
                  </time>
                </header>
                <p className="entry-excerpt">{previewEntryContent(entry.content)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="journal-empty">
            <h3>No journal entries yet</h3>
            <p className="muted">Select New entry to write your first journal entry.</p>
          </div>
        )}
      </section>
      <footer className="journal-footer">
        Signed in as <strong>{user.username}</strong>.
      </footer>
    </Window>
  );
}
