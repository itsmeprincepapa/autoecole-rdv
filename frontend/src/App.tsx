import { Link, Route, Routes } from 'react-router-dom';

// Pages provisoires : on les remplacera par les vraies à la tâche suivante
function Home() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-bold text-blue-700">Auto-école</h1>
      <p className="mt-2 text-slate-600">
        Plateforme de réservation de leçons de conduite.
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