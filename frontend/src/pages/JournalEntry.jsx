import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Window from '../components/Window.jsx';
import EntryForm from '../components/EntryForm.jsx';
import DeleteEntryDialog from '../components/DeleteEntryDialog.jsx';
import { formatEntryDate, formatEntryTimestamp } from '../utils/entries.js';

export default function JournalEntry({ editing = false }) {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
  }, [entryId, user.id, loadAttempt, editing]);

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
      <section
        className="journal-content"
        aria-label={editing ? 'Edit journal entry' : 'Journal entry'}
      >
        <header className="journal-header">
          <Link to={editing ? `/entries/${entryId}` : '/'}>
            {editing ? '← Back to entry' : '← Back to entries'}
          </Link>
          {!editing && !loading && !error && entry && (
            <div className="journal-actions">
              <Link className="button-link" to={`/entries/${entry.id}/edit`}>
                Edit
              </Link>
              <button
                type="button"
                className="danger-button"
                onClick={(event) => {
                  setDeleteTarget({ entry, returnFocus: event.currentTarget });
                }}
              >
                Delete
              </button>
            </div>
          )}
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
        ) : editing && entry ? (
          <EntryForm
            key={entry.id}
            initialEntry={entry}
            onSaved={(saved) => navigate(`/entries/${saved.id}`, { replace: true })}
            onCancel={() => navigate(`/entries/${entry.id}`)}
          />
        ) : (
          entry && (
            <article className="journal-entry entry-detail" aria-labelledby="entry-heading">
              <header>
                <h2 id="entry-heading">{entry.title}</h2>
                <time className="muted" dateTime={entry.date}>
                  {formatEntryDate(entry.date)}
                </time>
                {entry.updatedAt && (
                  <p className="entry-modified muted">
                    Last modified:{' '}
                    <time dateTime={entry.updatedAt}>{formatEntryTimestamp(entry.updatedAt)}</time>
                  </p>
                )}
              </header>
              <p className="entry-content">{entry.content}</p>
            </article>
          )
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
          onDeleted={() => navigate('/', { replace: true })}
        />
      )}
    </Window>
  );
}
