import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import EntryForm from '../components/EntryForm.jsx';
import Window from '../components/Window.jsx';

export default function NewEntry() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <div className="journal-content">
        <header className="journal-header">
          <Link to="/">← Back to entries</Link>
        </header>
        <EntryForm
          onSaved={(entry) => navigate(`/entries/${entry.id}`, { replace: true })}
          onCancel={() => navigate('/')}
        />
      </div>
      <footer className="journal-footer">
        Signed in as <strong>{user.username}</strong>.
      </footer>
    </Window>
  );
}
