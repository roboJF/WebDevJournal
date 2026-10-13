import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import EntryForm from '../components/EntryForm.jsx';
import Window from '../components/Window.jsx';

export default function Home() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api.entries()
      .then((data) => { if (!cancelled) setEntries(data.entries); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.id, loadAttempt]);

  function onSaved(entry) {
    setEntries((current) => [entry, ...current].sort((a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    ));
    setCreating(false);
    setNotice('Journal entry saved.');
  }

  return (
    <Window
      title="Muse"
      className="journal-window"
      actions={<button className="titlebar-btn" onClick={logout}>Log out</button>}
    >
      <section className="journal-content" aria-labelledby="journal-heading">
        <header className="journal-header">
          <div>
            <h2 id="journal-heading">Journal entries</h2>
            <p className="muted">A space for your thoughts and memories.</p>
          </div>
          {!creating && (
            <button type="button" disabled={loading || !!loadError} onClick={() => {
              setNotice('');
              setCreating(true);
            }}>New entry</button>
          )}
        </header>
        {notice && <p role="status">{notice}</p>}
        {creating && <EntryForm onSaved={onSaved} onCancel={() => setCreating(false)} />}
        {loading ? (
          <p className="loading" role="status">Loading journal entries…</p>
        ) : loadError ? (
          <div className="alert" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Try again</button>
          </div>
        ) : entries.length ? (
          <div className="journal-list">
            {entries.map((entry) => (
              <article className="journal-entry" key={entry.id} aria-labelledby={`entry-title-${entry.id}`}>
                <header>
                  <h3 id={`entry-title-${entry.id}`}>{entry.title}</h3>
                  <time className="muted" dateTime={entry.date}>
                    {new Date(`${entry.date}T00:00:00Z`).toLocaleDateString(undefined, {
                      dateStyle: 'long', timeZone: 'UTC',
                    })}
                  </time>
                </header>
                <p className="entry-content">{entry.content}</p>
              </article>
            ))}
          </div>
        ) : !creating && (
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
