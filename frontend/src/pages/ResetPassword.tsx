import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import SetPasswordForm from '../components/SetPasswordForm';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [doneMessage, setDoneMessage] = useState('');

  if (!token) {
    return (
      <AuthLayout title="Lien invalide">
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Ce lien est incomplet. Demandez un nouveau lien de réinitialisation.
        </p>
        <Link to="/forgot-password" className="mt-4 inline-block text-sm text-blue-700 underline">
          Mot de passe oublié
        </Link>
      </AuthLayout>
    );
  }

  if (doneMessage) {
    return (
      <AuthLayout title="Mot de passe modifié">
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{doneMessage}</p>
        <Link
          to="/login"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Se connecter
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez votre nouveau mot de passe.">
      <SetPasswordForm
        token={token}
        endpoint="/auth/reset-password"
        passwordField="newPassword"
        buttonLabel="Enregistrer le mot de passe"
        onSuccess={setDoneMessage}
      />
    </AuthLayout>
  );
}