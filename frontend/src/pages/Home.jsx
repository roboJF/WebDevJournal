import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import Window from '../components/Window.jsx';
import EntryMenu from '../components/EntryMenu.jsx';
import DeleteEntryDialog from '../components/DeleteEntryDialog.jsx';
import { formatEntryDate, previewEntryContent } from '../utils/entries.js';

export default function Home() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState('');
  const newEntryRef = useRef(null);

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
          <Link className="button-link" to="/entries/new" ref={newEntryRef}>
            New entry
          </Link>
        </header>
        {notice && <p role="status">{notice}</p>}
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
              <article className="journal-entry entry-card" key={entry.id}>
                <Link className="entry-preview" to={`/entries/${entry.id}`}>
                  <header>
                    <h3>{entry.title}</h3>
                    <time className="muted" dateTime={entry.date}>
                      {formatEntryDate(entry.date)}
                    </time>
                  </header>
                  <p className="entry-excerpt">{previewEntryContent(entry.content)}</p>
                </Link>
                <EntryMenu
                  entry={entry}
                  onDelete={(selected, returnFocus) => {
                    setNotice('');
                    setDeleteTarget({ entry: selected, returnFocus });
                  }}
                />
              </article>
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
      {deleteTarget && (
        <DeleteEntryDialog
          entry={deleteTarget.entry}
          returnFocus={deleteTarget.returnFocus}
          onCancel={() => setDeleteTarget(null)}
          onDeleted={(id) => {
            setEntries((current) => current.filter((entry) => entry.id !== id));
            setDeleteTarget(null);
            setNotice('Journal entry deleted.');
            newEntryRef.current?.focus();
          }}
        />
      )}
    </Window>
  );
}
