import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api, ApiError } from '../lib/api';

const RESEND_DELAY = 60;

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Si on vient de s'inscrire, un code vient d'être envoyé : on attend 1 minute avant un renvoi
  const [countdown, setCountdown] = useState(params.get('sent') ? RESEND_DELAY : 0);

  // Décompte avant de pouvoir renvoyer un code
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Après succès : redirection vers la connexion au bout de 2 secondes
  useEffect(() => {
    if (!verified) return;
    const timer = setTimeout(() => navigate('/login', { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [verified, navigate]);

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await api('/auth/verify-email', {
        method: 'POST',
        auth: false,
        body: { email, code },
      });
      setVerified(true);
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

  async function handleResend() {
    setError('');
    setInfo('');
    try {
      await api('/auth/resend-code', {
        method: 'POST',
        auth: false,
        body: { email },
      });
      setInfo('Si un compte non vérifié existe, un nouveau code a été envoyé.');
      setCountdown(RESEND_DELAY);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Patientez une minute avant de redemander un code.');
        setCountdown(RESEND_DELAY);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    }
  }

  if (verified) {
    return (
      <AuthLayout title="Email vérifié">
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Votre compte est activé. Redirection vers la connexion...
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-blue-700 underline">
          Aller à la connexion
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Vérifiez votre email"
      subtitle={`Saisissez le code à 6 chiffres envoyé à ${email}. Il est valable 10 minutes.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-slate-700">
            Code de vérification
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            required
            value={code}
            // Seuls les chiffres sont acceptés
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-2xl tracking-[0.5em] focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {info && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{info}</p>}

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Vérification...' : 'Vérifier'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0}
          className="text-blue-700 underline disabled:text-slate-400 disabled:no-underline"
        >
          {countdown > 0 ? `Renvoyer le code (${countdown} s)` : 'Renvoyer le code'}
        </button>
        <Link to="/login" className="text-slate-600 underline">
          Retour
        </Link>
      </div>
    </AuthLayout>
  );
}