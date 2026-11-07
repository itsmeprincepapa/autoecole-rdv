import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { ApiError } from '../lib/api';
import { homePath } from '../lib/roles';

export default function Login() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Déjà connecté : direction son espace
  if (!loading && user) {
    return <Navigate to={homePath(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      // La redirection se fait automatiquement une fois l'utilisateur connecté
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Trop de tentatives. Patientez une minute.');
        } else {
          setError(err.message);
          setNeedsVerification(err.message === 'Email non vérifié');
        }
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre espace.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Adresse email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
            {needsVerification && (
              <>
                {' '}
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email.trim())}`}
                  className="font-semibold underline"
                >
                  Saisir mon code
                </Link>
              </>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-blue-700 underline">
          Mot de passe oublié ?
        </Link>
        <Link to="/register" className="text-blue-700 underline">
          Créer un compte
        </Link>
      </div>
    </AuthLayout>
  );
}