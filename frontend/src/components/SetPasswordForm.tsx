import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import FormField from './FormField';

interface SetPasswordFormProps {
  token: string;
  // Route du backend appelée (reset-password ou accept-invitation)
  endpoint: string;
  // Nom du champ attendu par le backend : "newPassword" ou "password"
  passwordField: 'newPassword' | 'password';
  buttonLabel: string;
  onSuccess: (message: string) => void;
}

// Formulaire "choisir un mot de passe", partagé par la réinitialisation et l'invitation
export default function SetPasswordForm({
  token,
  endpoint,
  passwordField,
  buttonLabel,
  onSuccess,
}: SetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const res = await api<{ message: string }>(endpoint, {
        method: 'POST',
        auth: false,
        body: { token, [passwordField]: password },
      });
      onSuccess(res.message);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Nouveau mot de passe"
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
        {submitting ? 'Enregistrement...' : buttonLabel}
      </button>
    </form>
  );
}