import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../auth/useAuth';
import FormField from '../../components/FormField';
import { api, ApiError } from '../../lib/api';
import { formatShortDate } from '../../lib/format';
import type { AdminUser, Role, UsersResponse } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

const LIMIT = 20;

const ROLE_LABELS: Record<Role, string> = {
  student: 'Élève',
  instructor: 'Moniteur',
  admin: 'Gérant',
};

const FILTERS: { value: Role | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'student', label: 'Élèves' },
  { value: 'instructor', label: 'Moniteurs' },
  { value: 'admin', label: 'Gérants' },
];

type Panel = { id: string; kind: 'credit' | 'deactivate' };

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Une erreur est survenue';
}

export default function Users() {
  const { user: me } = useAuth();
  const [role, setRole] = useState<Role | ''>('');
  const [page, setPage] = useState(1);

  const users = useFetch<UsersResponse>(
    `/users?page=${page}&limit=${LIMIT}${role ? `&role=${role}` : ''}`,
  );

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<Panel | null>(null);
  const [busy, setBusy] = useState(false);

  // Invitation d'un moniteur
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState({ firstName: '', lastName: '', email: '' });

  // Crédit d'heures
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('');

  const totalPages = users.data ? Math.max(1, Math.ceil(users.data.total / LIMIT)) : 1;

  function clearMessages() {
    setNotice('');
    setError('');
  }

  function changeRole(next: Role | '') {
    setRole(next);
    setPage(1);
    setPanel(null);
    clearMessages();
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await api('/auth/invite-instructor', {
        method: 'POST',
        body: {
          email: invite.email.trim(),
          firstName: invite.firstName.trim(),
          lastName: invite.lastName.trim(),
        },
      });
      setNotice(
        `Invitation envoyée à ${invite.email.trim()}. Le lien est valable 48 heures.`,
      );
      setInvite({ firstName: '', lastName: '', email: '' });
      setInviting(false);
      users.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function setActive(target: AdminUser, isActive: boolean) {
    clearMessages();
    setBusy(true);
    try {
      await api(`/users/${target.id}/active`, { method: 'PATCH', body: { isActive } });
      setNotice(
        isActive
          ? `Le compte de ${target.firstName} ${target.lastName} est réactivé.`
          : `Le compte de ${target.firstName} ${target.lastName} est désactivé.`,
      );
      setPanel(null);
      users.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCredit(event: FormEvent, target: AdminUser) {
    event.preventDefault();
    clearMessages();

    const value = Number(amount);
    if (!Number.isInteger(value) || value === 0 || Math.abs(value) > 100) {
      setError('Saisissez un nombre entier d’heures, différent de 0, entre -100 et 100.');
      return;
    }

    setBusy(true);
    try {
      const res = await api<{ hoursBalance: number }>(`/students/${target.id}/hours`, {
        method: 'POST',
        body: { amount: value, ...(reason.trim() ? { reason: reason.trim() } : {}) },
      });
      setNotice(
        `${value > 0 ? '+' : ''}${value} h pour ${target.firstName} ${target.lastName}. Nouveau solde : ${res.hoursBalance} h.`,
      );
      setPanel(null);
      setReason('');
      users.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Utilisateurs
          </h1>
          {users.data && (
            <p className="mt-1 text-slate-600">
              {users.data.total} compte{users.data.total > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setInviting((v) => !v);
            clearMessages();
          }}
          className="rounded-lg bg-signal px-5 py-2.5 font-semibold text-white hover:bg-signal-dark"
        >
          {inviting ? 'Fermer' : 'Inviter un moniteur'}
        </button>
      </div>

      {inviting && (
        <form
          onSubmit={handleInvite}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6"
          aria-label="Inviter un moniteur"
        >
          <h2 className="font-display text-xl font-bold">Inviter un moniteur</h2>
          <p className="text-sm text-slate-600">
            Le moniteur reçoit un email avec un lien pour choisir son mot de passe et activer
            son compte.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Prénom"
              name="invite-firstName"
              required
              maxLength={100}
              value={invite.firstName}
              onChange={(e) => setInvite({ ...invite, firstName: e.target.value })}
            />
            <FormField
              label="Nom"
              name="invite-lastName"
              required
              maxLength={100}
              value={invite.lastName}
              onChange={(e) => setInvite({ ...invite, lastName: e.target.value })}
            />
          </div>
          <FormField
            label="Adresse email"
            name="invite-email"
            type="email"
            required
            value={invite.email}
            onChange={(e) => setInvite({ ...invite, email: e.target.value })}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-signal px-6 py-2.5 font-bold text-white hover:bg-signal-dark disabled:opacity-60"
          >
            {busy ? 'Envoi...' : "Envoyer l'invitation"}
          </button>
        </form>
      )}

      {notice && (
        <p role="status" className="rounded-xl bg-green-100 p-4 text-sm font-semibold text-green-900">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-100 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Filtre par rôle */}
      <div role="tablist" aria-label="Filtrer par rôle" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={role === f.value}
            onClick={() => changeRole(f.value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              role === f.value ? 'bg-navy text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {users.loading && <p className="text-slate-600">Chargement...</p>}
      {users.error && (
        <p role="alert" className="text-red-700">
          {users.error}
        </p>
      )}
      {users.data && users.data.items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Aucun compte dans cette catégorie.
        </p>
      )}

      <ul className="space-y-3">
        {(users.data?.items ?? []).map((u) => {
          const isMe = u.id === me?.id;
          const open = panel?.id === u.id ? panel.kind : null;
          return (
            <li
              key={u.id}
              className={`rounded-3xl border bg-white p-5 ${
                u.isActive ? 'border-slate-200' : 'border-slate-200 opacity-75'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold">
                    {u.firstName} {u.lastName}
                    {isMe && <span className="ml-2 text-sm font-normal text-slate-500">(vous)</span>}
                  </p>
                  <p className="truncate text-sm text-slate-600">{u.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-mist px-2.5 py-1">{ROLE_LABELS[u.role]}</span>
                    {!u.isActive && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-800">
                        Désactivé
                      </span>
                    )}
                    {!u.emailVerified && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">
                        Email non vérifié
                      </span>
                    )}
                    <span className="px-1 py-1 font-normal text-slate-500">
                      Inscrit le {formatShortDate(u.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {u.role === 'student' && (
                    <p className="rounded-xl bg-navy px-4 py-2 font-display text-lg font-bold text-line">
                      {u.hoursBalance} h
                    </p>
                  )}
                  {u.role === 'student' && open !== 'credit' && (
                    <button
                      type="button"
                      onClick={() => {
                        setPanel({ id: u.id, kind: 'credit' });
                        clearMessages();
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Ajouter des heures
                    </button>
                  )}
                  {!isMe &&
                    (u.isActive ? (
                      open !== 'deactivate' && (
                        <button
                          type="button"
                          onClick={() => {
                            setPanel({ id: u.id, kind: 'deactivate' });
                            clearMessages();
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                          Désactiver
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setActive(u, true)}
                        className="rounded-lg bg-signal px-4 py-2 text-sm font-bold text-white hover:bg-signal-dark disabled:opacity-60"
                      >
                        Réactiver
                      </button>
                    ))}
                </div>
              </div>

              {open === 'credit' && (
                <form
                  onSubmit={(e) => handleCredit(e, u)}
                  className="mt-4 space-y-4 rounded-2xl bg-mist p-5"
                  aria-label={`Ajouter des heures à ${u.firstName} ${u.lastName}`}
                >
                  <p className="text-sm text-slate-700">
                    Solde actuel : <span className="font-bold">{u.hoursBalance} h</span>. Un
                    nombre négatif retire des heures.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                    <FormField
                      label="Heures"
                      name={`amount-${u.id}`}
                      type="number"
                      step={1}
                      min={-100}
                      max={100}
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <FormField
                      label="Motif (facultatif)"
                      name={`reason-${u.id}`}
                      maxLength={255}
                      placeholder="Forfait 20 h payé en agence"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-lg bg-signal px-5 py-2.5 font-bold text-white hover:bg-signal-dark disabled:opacity-60"
                    >
                      {busy ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPanel(null)}
                      className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {open === 'deactivate' && (
                <div role="alertdialog" aria-label="Confirmer la désactivation" className="mt-4 rounded-2xl bg-amber-50 p-5">
                  <p className="font-semibold text-amber-900">
                    Désactiver le compte de {u.firstName} {u.lastName} ?
                  </p>
                  <p className="mt-1 text-sm text-amber-900">
                    Cette personne sera déconnectée et ne pourra plus se connecter. Vous pourrez
                    réactiver le compte à tout moment. Ses leçons déjà réservées ne sont pas
                    annulées.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setActive(u, false)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {busy ? 'Désactivation...' : 'Oui, désactiver'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPanel(null)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Garder actif
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {users.data && totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              setPage((p) => p - 1);
              setPanel(null);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Précédent
          </button>
          <p className="text-sm text-slate-600">
            Page {page} sur {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              setPage((p) => p + 1);
              setPanel(null);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Suivant
          </button>
        </nav>
      )}
    </div>
  );
}