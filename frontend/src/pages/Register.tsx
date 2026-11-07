import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { api, ApiError } from '../lib/api';
import { homePath } from '../lib/roles';

export default function Register() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Déjà connecté : direction son espace
  if (!loading && user) {
    return <Navigate to={homePath(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    // Mêmes règles que le backend (le serveur revérifie de toute façon)
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = email.trim();
      await api('/auth/register', {
        method: 'POST',
        auth: false,
        body: {
          email: cleanEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        },
      });
      // Le code vient d'être envoyé : on passe à sa saisie
      navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}&sent=1`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Trop de tentatives. Patientez une minute.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Un code de vérification vous sera envoyé par email."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Prénom"
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={100}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <FormField
            label="Nom"
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={100}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
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
          autoComplete="new-password"
          required
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormField
          label="Confirmer le mot de passe"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          8 caractères minimum, avec au moins une lettre et un chiffre.
        </p>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-blue-700 underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}