import { useMemo, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { formatDateTime, nextDays } from '../../lib/format';
import type {
  AdminAppointmentsResponse,
  AppointmentStatus,
  Instructor,
} from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

const LIMIT = 20;

const STATUS: Record<AppointmentStatus, { label: string; style: string }> = {
  confirmed: { label: 'Confirmée', style: 'bg-blue-100 text-blue-900' },
  completed: { label: 'Effectuée', style: 'bg-green-100 text-green-900' },
  no_show: { label: 'Absence', style: 'bg-amber-100 text-amber-900' },
  cancelled: { label: 'Annulée', style: 'bg-slate-200 text-slate-700' },
};

const STATUS_OPTIONS: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'completed', label: 'Effectuées' },
  { value: 'no_show', label: 'Absences' },
  { value: 'cancelled', label: 'Annulées' },
];

const fieldClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal';

export default function Appointments() {
  // Par défaut : de aujourd'hui à dans 30 jours
  const defaults = useMemo(() => {
    const days = nextDays(31);
    return { from: days[0].date, to: days[30].date };
  }, []);

  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [instructorId, setInstructorId] = useState('');
  const [page, setPage] = useState(1);

  const instructors = useFetch<Instructor[]>('/instructors');

  // Les dates ne servent que si les deux sont renseignées (comme côté backend)
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (from && to) {
    params.set('from', from);
    params.set('to', to);
  }
  if (status) params.set('status', status);
  if (instructorId) params.set('instructorId', instructorId);

  const invalidRange = Boolean(from && to && to < from);
  const list = useFetch<AdminAppointmentsResponse>(
    invalidRange ? null : `/admin/appointments?${params.toString()}`,
  );

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / LIMIT)) : 1;
  const now = Date.now();

  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
    setConfirmId(null);
    setNotice('');
    setError('');
  }

  async function cancel(id: string) {
    setCancelling(true);
    setNotice('');
    setError('');
    try {
      const res = await api<{ message: string }>(`/appointments/${id}/cancel`, {
        method: 'POST',
      });
      setNotice(`${res.message} L'élève est prévenu par email.`);
      setConfirmId(null);
      list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Rendez-vous
        </h1>
        {list.data && (
          <p className="mt-1 text-slate-600">
            {list.data.total} rendez-vous
          </p>
        )}
      </div>

      {/* Filtres */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Filtrer les rendez-vous"
      >
        <div>
          <label htmlFor="from" className="block text-sm font-medium text-slate-700">
            Du
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => changeFilter(() => setFrom(e.target.value))}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-slate-700">
            Au
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => changeFilter(() => setTo(e.target.value))}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            Statut
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) =>
              changeFilter(() => setStatus(e.target.value as AppointmentStatus | ''))
            }
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="instructor" className="block text-sm font-medium text-slate-700">
            Moniteur
          </label>
          <select
            id="instructor"
            value={instructorId}
            onChange={(e) => changeFilter(() => setInstructorId(e.target.value))}
            className={fieldClass}
          >
            <option value="">Tous les moniteurs</option>
            {(instructors.data ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.firstName} {i.lastName}
              </option>
            ))}
          </select>
        </div>
      </form>

      {invalidRange && (
        <p role="alert" className="rounded-xl bg-red-100 p-4 text-sm text-red-800">
          La date de fin doit être après la date de début.
        </p>
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

      {list.loading && <p className="text-slate-600">Chargement...</p>}
      {list.error && (
        <p role="alert" className="text-red-700">
          {list.error}
        </p>
      )}
      {list.data && list.data.items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Aucun rendez-vous pour ces filtres.
        </p>
      )}

      <ul className="space-y-3">
        {(list.data?.items ?? []).map((a) => {
          const cancellable = a.status === 'confirmed' && new Date(a.startsAt).getTime() > now;
          return (
            <li key={a.id} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div>
                  <p className="font-display text-lg font-bold capitalize">
                    {formatDateTime(a.startsAt)}
                  </p>
                  <p className="mt-1 text-slate-800">
                    <span className="font-semibold">
                      {a.student.firstName} {a.student.lastName}
                    </span>{' '}
                    avec {a.instructor.firstName} {a.instructor.lastName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {a.vehicle.model} ({a.vehicle.plateNumber})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS[a.status].style}`}
                  >
                    {STATUS[a.status].label}
                  </span>
                  {cancellable && confirmId !== a.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmId(a.id);
                        setNotice('');
                        setError('');
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>

              {confirmId === a.id && (
                <div
                  role="alertdialog"
                  aria-label="Confirmer l'annulation"
                  className="mt-4 rounded-2xl bg-amber-50 p-5"
                >
                  <p className="font-semibold text-amber-900">Annuler cette leçon ?</p>
                  <p className="mt-1 text-sm text-amber-900">
                    L'heure de {a.student.firstName} est rendue dans tous les cas, et l'élève est
                    prévenu par email. Le créneau redevient disponible.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => cancel(a.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {cancelling ? 'Annulation...' : "Oui, annuler la leçon"}
                    </button>
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => setConfirmId(null)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Garder la leçon
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {list.data && totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              setPage((p) => p - 1);
              setConfirmId(null);
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
              setConfirmId(null);
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