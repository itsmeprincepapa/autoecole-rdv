import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { buttonLink, errorBox, linkClass, successBox } from '../components/authStyles';
import SetPasswordForm from '../components/SetPasswordForm';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [doneMessage, setDoneMessage] = useState('');

  if (!token) {
    return (
      <AuthLayout title="Lien invalide">
        <p className={errorBox}>
          Ce lien est incomplet. Demandez un nouveau lien de réinitialisation.
        </p>
        <Link to="/forgot-password" className={`mt-5 inline-block text-sm ${linkClass}`}>
          Mot de passe oublié
        </Link>
      </AuthLayout>
    );
  }

  if (doneMessage) {
    return (
      <AuthLayout title="Mot de passe modifié">
        <p className={successBox}>{doneMessage}</p>
        <Link to="/login" className={buttonLink}>
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