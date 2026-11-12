import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AuthLayout from '../components/AuthLayout';
import { errorBox, linkClass, primaryButton } from '../components/authStyles';
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

  // Indicateurs visuels des règles du mot de passe
  const rules = [
    { label: '8 caractères minimum', ok: password.length >= 8 },
    { label: 'Une lettre', ok: /[A-Za-z]/.test(password) },
    { label: 'Un chiffre', ok: /\d/.test(password) },
  ];

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
      <form onSubmit={handleSubmit} className="space-y-5">
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
          placeholder="vous@exemple.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="space-y-2.5">
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
          <ul className="flex flex-wrap gap-2 text-xs">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={`rounded-full px-2.5 py-1 font-medium transition ${
                  rule.ok ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {rule.ok ? '✓' : '○'} {rule.label}
              </li>
            ))}
          </ul>
        </div>
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

        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
        Déjà un compte ?{' '}
        <Link to="/login" className={linkClass}>
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}