import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { errorBox, linkClass, primaryButton, successBox } from '../components/authStyles';
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
        <p className={successBox}>
          Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être
          envoyé. Il est valable 30 minutes et ne peut servir qu'une fois.
        </p>
        <Link to="/login" className={`mt-5 inline-block text-sm ${linkClass}`}>
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

        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5 text-sm">
        <Link to="/login" className={linkClass}>
          ← Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  );
}