import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { homePath } from './lib/roles';
import AcceptInvitation from './pages/AcceptInvitation';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// "/" : page d'accueil pour les visiteurs, espace personnel pour un utilisateur connecté
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-slate-600">Chargement...</p>;
  if (user) return <Navigate to={homePath(user.role)} replace />;
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />

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