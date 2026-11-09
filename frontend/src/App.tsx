import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { homePath } from './lib/roles';
import AcceptInvitation from './pages/AcceptInvitation';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './pages/admin/AdminLayout';
import Users from './pages/admin/Users';
import ComingSoon from './pages/ComingSoon';
import ForgotPassword from './pages/ForgotPassword';
import Availability from './pages/instructor/Availability';
import InstructorLayout from './pages/instructor/InstructorLayout';
import Planning from './pages/instructor/Planning';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Book from './pages/student/Book';
import Lessons from './pages/student/Lessons';
import Progress from './pages/student/Progress';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentLayout from './pages/student/StudentLayout';
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

      {/* Espace élève */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="book" element={<Book />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="progress" element={<Progress />} />
      </Route>

      {/* Espace moniteur */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute roles={['instructor']}>
            <InstructorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Planning />} />
        <Route path="availability" element={<Availability />} />
      </Route>

      {/* Espace gérant */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="vehicles" element={<ComingSoon title="Véhicules" />} />
        <Route path="appointments" element={<ComingSoon title="Rendez-vous" />} />
      </Route>

      {/* Toute autre adresse : retour à l'accueil */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}