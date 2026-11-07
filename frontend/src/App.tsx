import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { homePath } from './lib/roles';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

// "/" envoie vers l'espace de l'utilisateur, ou vers la connexion
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-slate-600">Chargement...</p>;
  return <Navigate to={user ? homePath(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['student']}>
            <Dashboard title="Espace élève" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor"
        element={
          <ProtectedRoute roles={['instructor']}>
            <Dashboard title="Espace moniteur" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <Dashboard title="Espace gérant" />
          </ProtectedRoute>
        }
      />

      {/* Toute autre adresse : retour à l'accueil */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}