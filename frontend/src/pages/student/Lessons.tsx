import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import type { Appointment, AppointmentStatus } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

// Même règle que le backend : remboursement si l'annulation a lieu 24 h avant
const FREE_CANCELLATION_MS = 24 * 60 * 60 * 1000;

const STATUS: Record<AppointmentStatus, { label: string; style: string }> = {
  confirmed: { label: 'Confirmée', style: 'bg-blue-100 text-blue-900' },
  completed: { label: 'Effectuée', style: 'bg-green-100 text-green-900' },
  no_show: { label: 'Absence', style: 'bg-amber-100 text-amber-900' },
  cancelled: { label: 'Annulée', style: 'bg-slate-200 text-slate-700' },
};

type Tab = 'upcoming' | 'past';

export default function Lessons() {
  const lessons = useFetch<Appointment[]>('/appointments/mine');
  const [tab, setTab] = useState<Tab>('upcoming');
  // Leçon dont l'annulation est en cours de confirmation
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const now = Date.now();
  const all = lessons.data ?? [];

  const upcoming = all
    .filter((a) => a.status === 'confirmed' && new Date(a.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = all
    .filter((a) => !upcoming.includes(a))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const shown = tab === 'upcoming' ? upcoming : past;

  async function cancel(id: string) {
    setCancelling(true);
    setError('');
    setNotice('');
    try {
      const res = await api<{ message: string; refunded: boolean }>(
        `/appointments/${id}/cancel`,
        { method: 'POST' },
      );
      setNotice(res.message);
      setConfirmingId(null);
      lessons.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Mes leçons
        </h1>
        <Link
          to="/student/book"
          className="rounded-lg bg-signal px-5 py-2.5 font-semibold text-white hover:bg-signal-dark"
        >
          Réserver une leçon
        </Link>
      </div>

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

      <div role="tablist" aria-label="Mes leçons" className="flex gap-2">
        {(
          [
            ['upcoming', `À venir (${upcoming.length})`],
            ['past', `Passées (${past.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === key ? 'bg-navy text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {lessons.loading && <p className="text-slate-600">Chargement...</p>}
      {lessons.error && (
        <p role="alert" className="text-red-700">
          {lessons.error}
        </p>
      )}

      {!lessons.loading && !lessons.error && shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-700">
            {tab === 'upcoming' ? 'Aucune leçon à venir.' : 'Aucune leçon passée pour le moment.'}
          </p>
          {tab === 'upcoming' && (
            <Link
              to="/student/book"
              className="mt-4 inline-block text-sm font-semibold text-signal underline"
            >
              Réserver une leçon
            </Link>
          )}
        </div>
      )}

      <ul className="space-y-4">
        {shown.map((lesson) => {
          const start = new Date(lesson.startsAt).getTime();
          const isUpcoming = upcoming.includes(lesson);
          const freeUntil = new Date(start - FREE_CANCELLATION_MS);
          const isFree = now < freeUntil.getTime();
          // Confirmée mais passée : le moniteur ne l'a pas encore clôturée
          const status =
            lesson.status === 'confirmed' && !isUpcoming
              ? { label: 'En attente de clôture', style: 'bg-slate-200 text-slate-700' }
              : STATUS[lesson.status];

          return (
            <li key={lesson.id} className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold capitalize">
                    {formatDateTime(lesson.startsAt)}
                  </p>
                  <p className="mt-1 text-slate-700">
                    Moniteur : {lesson.instructor.firstName} {lesson.instructor.lastName}
                  </p>
                  <p className="text-slate-700">
                    Véhicule : {lesson.vehicle.model} ({lesson.vehicle.plateNumber})
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.style}`}>
                  {status.label}
                </span>
              </div>

              {lesson.notes && (
                <div className="mt-4 rounded-xl bg-mist p-4 text-sm">
                  <p className="font-semibold">Observations du moniteur</p>
                  <p className="mt-1 whitespace-pre-line text-slate-700">{lesson.notes}</p>
                </div>
              )}

              {isUpcoming && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className={`text-sm ${isFree ? 'text-green-800' : 'text-amber-800'}`}>
                    {isFree
                      ? `Annulation gratuite jusqu'au ${formatDateTime(freeUntil.toISOString())}.`
                      : "Annulation tardive : l'heure ne vous sera pas rendue."}
                  </p>

                  {confirmingId === lesson.id ? (
                    <div
                      role="alertdialog"
                      aria-label="Confirmer l'annulation"
                      className="mt-3 rounded-xl bg-amber-50 p-4"
                    >
                      <p className="font-semibold text-amber-900">Annuler cette leçon ?</p>
                      <p className="mt-1 text-sm text-amber-900">
                        {isFree
                          ? 'Votre heure vous sera rendue.'
                          : "Vous annulez à moins de 24 heures de la leçon : l'heure sera perdue."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={cancelling}
                          onClick={() => cancel(lesson.id)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {cancelling ? 'Annulation...' : "Confirmer l'annulation"}
                        </button>
                        <button
                          type="button"
                          disabled={cancelling}
                          onClick={() => setConfirmingId(null)}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                          Garder la leçon
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(lesson.id);
                        setError('');
                        setNotice('');
                      }}
                      className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Annuler cette leçon
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}