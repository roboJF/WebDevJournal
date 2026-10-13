import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import JournalEntry from './pages/JournalEntry.jsx';
import NewEntry from './pages/NewEntry.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entries/new"
        element={
          <ProtectedRoute>
            <NewEntry />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entries/:entryId"
        element={
          <ProtectedRoute>
            <JournalEntry />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
