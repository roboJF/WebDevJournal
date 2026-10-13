import { useAuth } from '../context/AuthContext.jsx';
import Window from '../components/Window.jsx';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <Window
      title="Muse"
      actions={<button className="titlebar-btn" onClick={logout}>Log out</button>}
    >
      <p>Signed in as <strong>{user.username}</strong>.</p>
      <p className="muted">Journal entries will show up here once they're built.</p>
    </Window>
  );
}
