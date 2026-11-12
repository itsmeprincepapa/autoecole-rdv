import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AuthLayout from '../components/AuthLayout';
import { errorBox, linkClass, primaryButton } from '../components/authStyles';
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Adresse email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className={errorBox}>
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

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 text-sm">
        <Link to="/forgot-password" className={linkClass}>
          Mot de passe oublié ?
        </Link>
        <Link to="/register" className={linkClass}>
          Créer un compte
        </Link>
      </div>
    </AuthLayout>
  );
}