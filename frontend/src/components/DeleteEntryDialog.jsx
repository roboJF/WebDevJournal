import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../api/client.js';

export default function DeleteEntryDialog({ entry, returnFocus, onDeleted, onCancel }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = returnFocus || document.activeElement;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [returnFocus]);

  async function confirmDelete() {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await api.deleteEntry(entry.id);
      dialogRef.current.close();
      onDeleted(entry.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      className="delete-dialog"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting) onCancel();
      }}
    >
      <header className="titlebar">
        <h2 id={titleId}>Delete journal entry?</h2>
      </header>
      <div className="window-body">
        <p id={descriptionId}>
          Are you sure you want to permanently delete <strong>{entry.title}</strong>? This cannot be
          undone.
        </p>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="entry-form-actions">
          <button type="button" ref={cancelRef} disabled={submitting} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="danger-button"
            disabled={submitting}
            onClick={confirmDelete}
          >
            {submitting ? 'Deleting…' : 'Delete entry'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
