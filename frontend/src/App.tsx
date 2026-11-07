import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/useAuth';

// Pages provisoires : remplacées par les vraies à partir de la tâche 64
function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-bold text-blue-700">Auto-école</h1>
      <p className="mt-2 text-slate-600">
        Plateforme de réservation de leçons de conduite.
      </p>

      <p className="mt-4 rounded border border-slate-300 bg-white p-3 text-sm">
        {loading
          ? 'Chargement de la session...'
          : user
            ? `Connecté : ${user.firstName} ${user.lastName} (${user.role})`
            : 'Non connecté'}
      </p>

      <Link
        to="/login"
        className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Aller à la connexion
      </Link>
    </div>
  );
}

function Login() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <Link to="/" className="mt-4 inline-block text-blue-600 underline">
        Retour à l'accueil
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}