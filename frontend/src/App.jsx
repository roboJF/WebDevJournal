import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import JournalEntry from './pages/JournalEntry.jsx';
import NewEntry from './pages/NewEntry.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// A data router provides navigation blocking, including browser Back/Forward.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      }
    >
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
        path="/entries/:entryId/edit"
        element={
          <ProtectedRoute>
            <JournalEntry editing />
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
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
