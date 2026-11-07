import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { api, ApiError } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: { email: email.trim() },
      });
      // Message identique que l'email existe ou non (comme le backend)
      setSent(true);
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

  if (sent) {
    return (
      <AuthLayout title="Vérifiez votre boîte mail">
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être
          envoyé. Il est valable 30 minutes et ne peut servir qu'une fois.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-blue-700 underline">
          Retour à la connexion
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Saisissez votre adresse email pour recevoir un lien de réinitialisation."
    >
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
          {submitting ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </form>

      <Link to="/login" className="mt-4 inline-block text-sm text-blue-700 underline">
        Retour à la connexion
      </Link>
    </AuthLayout>
  );
}