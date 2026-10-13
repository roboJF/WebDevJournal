import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Window from '../components/Window.jsx';
import Field from '../components/Field.jsx';

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: 'Passwords do not match.' });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form.username.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      if (!Object.keys(err.fieldErrors || {}).length) setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Window title="Create your Muse account">
      <form onSubmit={onSubmit} noValidate>
        {formError && <p className="alert" role="alert">{formError}</p>}
        <Field label="Username" name="username" autoComplete="username" autoFocus
               hint="3-30 letters, numbers, or underscores."
               value={form.username} onChange={update} error={fieldErrors.username} />
        <Field label="Password" name="password" type="password" autoComplete="new-password"
               hint="At least 8 characters."
               value={form.password} onChange={update} error={fieldErrors.password} />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password"
               value={form.confirm} onChange={update} error={fieldErrors.confirm} />
        <button type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="switch">Already have an account? <Link to="/login">Log in</Link></p>
    </Window>
  );
}
