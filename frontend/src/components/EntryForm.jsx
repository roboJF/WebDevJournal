import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import Field from './Field.jsx';

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function EntryForm({ initialEntry, onSaved, onCancel, onDirtyChange }) {
  const editing = !!initialEntry;
  const [initialForm] = useState(() =>
    initialEntry
      ? { title: initialEntry.title, date: initialEntry.date, content: initialEntry.content }
      : { title: '', date: today(), content: '' },
  );
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    onDirtyChange(false);
    return () => {
      mountedRef.current = false;
      onDirtyChange(false);
    };
  }, [onDirtyChange]);

  function update(event) {
    const next = { ...form, [event.target.name]: event.target.value };
    // Update the guard in the same event so an immediate Back/Cancel sees the latest values.
    onDirtyChange(Object.keys(initialForm).some((key) => next[key] !== initialForm[key]));
    setForm(next);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      const { entry } = editing
        ? await api.updateEntry(initialEntry.id, form)
        : await api.createEntry(form);
      if (mountedRef.current) onSaved(entry);
    } catch (err) {
      if (!mountedRef.current) return;
      setFieldErrors(err.fieldErrors || {});
      if (!Object.keys(err.fieldErrors || {}).length) setFormError(err.message);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }

  return (
    <section className="entry-composer" aria-labelledby="entry-form-heading">
      <h2 id="entry-form-heading">{editing ? 'Edit journal entry' : 'New journal entry'}</h2>
      <form onSubmit={onSubmit}>
        {formError && (
          <p className="alert" role="alert">
            {formError}
          </p>
        )}
        <fieldset disabled={submitting}>
          <Field
            label="Title"
            name="title"
            value={form.title}
            onChange={update}
            error={fieldErrors.title}
            maxLength={200}
            required
            autoFocus
          />
          <Field
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={update}
            error={fieldErrors.date}
            min="0001-01-01"
            max="9999-12-31"
            required
          />
          <Field
            label="Written content"
            name="content"
            multiline
            rows={10}
            value={form.content}
            onChange={update}
            error={fieldErrors.content}
            maxLength={100000}
            required
          />
          <div className="entry-form-actions">
            <button type="submit">
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Save entry'}
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
