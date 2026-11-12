import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { buttonLink, errorBox, successBox } from '../components/authStyles';
import SetPasswordForm from '../components/SetPasswordForm';

export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [doneMessage, setDoneMessage] = useState('');

  if (!token) {
    return (
      <AuthLayout title="Invitation invalide">
        <p className={errorBox}>
          Ce lien est incomplet. Demandez au gérant de renvoyer l'invitation.
        </p>
      </AuthLayout>
    );
  }

  if (doneMessage) {
    return (
      <AuthLayout title="Compte activé">
        <p className={successBox}>{doneMessage}</p>
        <Link to="/login" className={buttonLink}>
          Se connecter
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Bienvenue dans l'équipe"
      subtitle="Choisissez votre mot de passe pour activer votre compte moniteur."
    >
      <SetPasswordForm
        token={token}
        endpoint="/auth/accept-invitation"
        passwordField="password"
        buttonLabel="Activer mon compte"
        onSuccess={setDoneMessage}
      />
    </AuthLayout>
  );
}