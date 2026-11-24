import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Window from '../components/Window.jsx';
import Field from '../components/Field.jsx';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ username: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to={redirectTo} replace />;

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      await login(form.username.trim(), form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      // Field-level messages already explain validation errors; otherwise show the general one
      if (!Object.keys(err.fieldErrors || {}).length) setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Window title="Log in to Muse">
      <form onSubmit={onSubmit} noValidate>
        {formError && (
          <p className="alert" role="alert">
            {formError}
          </p>
        )}
        <Field
          label="Username"
          name="username"
          autoComplete="username"
          autoFocus
          value={form.username}
          onChange={update}
          error={fieldErrors.username}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update}
          error={fieldErrors.password}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </Window>
  );
}
