import { useState } from 'react';
import { api } from '../api/client.js';
import Field from './Field.jsx';

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function EntryForm({ onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({ title: '', date: today(), content: '' }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      const { entry } = await api.createEntry(form);
      onSaved(entry);
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      if (!Object.keys(err.fieldErrors || {}).length) setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="entry-composer" aria-labelledby="new-entry-heading">
      <h3 id="new-entry-heading">New journal entry</h3>
      <form onSubmit={onSubmit}>
        {formError && <p className="alert" role="alert">{formError}</p>}
        <fieldset disabled={submitting}>
          <Field label="Title" name="title" value={form.title} onChange={update}
                 error={fieldErrors.title} maxLength={200} required autoFocus />
          <Field label="Date" name="date" type="date" value={form.date} onChange={update}
                 error={fieldErrors.date} min="0001-01-01" max="9999-12-31" required />
          <Field label="Written content" name="content" multiline rows={10}
                 value={form.content} onChange={update} error={fieldErrors.content}
                 maxLength={100000} required />
          <div className="entry-form-actions">
            <button type="submit">{submitting ? 'Saving…' : 'Save entry'}</button>
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
