import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Window from '../components/Window.jsx';
import { formatEntryDate } from '../utils/entries.js';

export default function JournalEntry() {
  const { entryId } = useParams();
  const { user, logout } = useAuth();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setEntry(null);
    setLoading(true);
    setError(null);
    api
      .entry(entryId)
      .then((data) => {
        if (!cancelled) setEntry(data.entry);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryId, user.id, loadAttempt]);

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
      <section className="journal-content" aria-label="Journal entry">
        <header className="journal-header">
          <Link to="/">← Back to entries</Link>
        </header>
        {loading ? (
          <p className="loading" role="status">
            Loading journal entry…
          </p>
        ) : error ? (
          <div className="alert" role="alert">
            <p>{error.message}</p>
            {error.status !== 404 && (
              <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                Try again
              </button>
            )}
          </div>
        ) : (
          entry && (
            <article className="journal-entry entry-detail" aria-labelledby="entry-heading">
              <header>
                <h2 id="entry-heading">{entry.title}</h2>
                <time className="muted" dateTime={entry.date}>
                  {formatEntryDate(entry.date)}
                </time>
              </header>
              <p className="entry-content">{entry.content}</p>
            </article>
          )
        )}
      </section>
      <footer className="journal-footer">
        Signed in as <strong>{user.username}</strong>.
      </footer>
    </Window>
  );
}
