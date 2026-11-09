import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../auth/useAuth';
import { api, ApiError } from '../../lib/api';
import type { AvailabilityRange } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

// Lundi en premier (le backend numérote 0 = dimanche ... 6 = samedi)
const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

const hhmm = (time: string) => time.slice(0, 5);

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Nombre de leçons d'1 heure qui tiennent dans la plage
const lessonCount = (range: AvailabilityRange) =>
  Math.floor((toMinutes(range.endTime) - toMinutes(range.startTime)) / 60);

export default function Availability() {
  const { user } = useAuth();
  const base = user ? `/instructors/${user.id}/availabilities` : null;
  const ranges = useFetch<AvailabilityRange[]>(base);

  const [day, setDay] = useState(1);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('12:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Plage dont la suppression attend une confirmation
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const all = ranges.data ?? [];
  const totalLessons = all.reduce((sum, r) => sum + lessonCount(r), 0);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (toMinutes(end) <= toMinutes(start)) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    if (!base) return;

    setSubmitting(true);
    try {
      await api(base, {
        method: 'POST',
        body: { dayOfWeek: day, startTime: start, endTime: end },
      });
      setNotice('Plage ajoutée.');
      ranges.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!base) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      await api(`${base}/${id}`, { method: 'DELETE' });
      setConfirmId(null);
      setNotice('Plage supprimée.');
      ranges.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Mes disponibilités
        </h1>
        <p className="mt-1 text-slate-600">
          Ce sont les plages pendant lesquelles les élèves peuvent réserver avec vous, chaque
          semaine.
          {ranges.data && ` Vous offrez ${totalLessons} leçon${totalLessons > 1 ? 's' : ''} d'une heure par semaine.`}
        </p>
      </div>

      {/* Ajouter une plage */}
      <form
        onSubmit={handleAdd}
        className="rounded-3xl border border-slate-200 bg-white p-6"
        aria-label="Ajouter une plage horaire"
      >
        <h2 className="font-display text-xl font-bold">Ajouter une plage</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="day" className="block text-sm font-medium text-slate-700">
              Jour
            </label>
            <select
              id="day"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-slate-700">
              De
            </label>
            <input
              id="start"
              type="time"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
          <div>
            <label htmlFor="end" className="block text-sm font-medium text-slate-700">
              À
            </label>
            <input
              id="end"
              type="time"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-signal px-6 py-2.5 font-bold text-white hover:bg-signal-dark disabled:opacity-60"
          >
            {submitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Les leçons durent 1 heure et commencent à l'heure de début de la plage : de 08:00 à
          12:00, les élèves peuvent réserver 08:00, 09:00, 10:00 et 11:00.
        </p>
      </form>

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

      {ranges.loading && <p className="text-slate-600">Chargement...</p>}
      {ranges.error && (
        <p role="alert" className="text-red-700">
          {ranges.error}
        </p>
      )}

      {/* Semaine type */}
      {ranges.data && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">Ma semaine type</h2>
          {all.length === 0 && (
            <p className="mt-3 rounded-xl bg-amber-100 p-4 text-sm text-amber-900">
              Vous n'avez encore aucune plage : aucun élève ne peut réserver avec vous. Ajoutez
              vos horaires ci-dessus.
            </p>
          )}
          <ul className="mt-4 divide-y divide-slate-100">
            {DAYS.map((d) => {
              const dayRanges = all
                .filter((r) => r.dayOfWeek === d.value)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <li
                  key={d.value}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:gap-6"
                >
                  <p className="w-28 shrink-0 font-display text-lg font-bold">{d.label}</p>
                  {dayRanges.length === 0 ? (
                    <p className="text-slate-500">Pas de disponibilité</p>
                  ) : (
                    <ul className="flex flex-1 flex-col gap-2">
                      {dayRanges.map((r) => (
                        <li key={r.id} className="rounded-xl bg-mist px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-semibold">
                              {hhmm(r.startTime)} – {hhmm(r.endTime)}
                              <span className="ml-2 text-sm font-normal text-slate-600">
                                {lessonCount(r)} leçon{lessonCount(r) > 1 ? 's' : ''}
                              </span>
                            </p>
                            {confirmId !== r.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmId(r.id);
                                  setError('');
                                  setNotice('');
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                                aria-label={`Supprimer la plage de ${d.label} ${hhmm(r.startTime)} à ${hhmm(r.endTime)}`}
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                          {confirmId === r.id && (
                            <div role="alertdialog" aria-label="Confirmer la suppression" className="mt-3">
                              <p className="text-sm text-amber-900">
                                Supprimer cette plage ? Les leçons déjà réservées ne sont pas
                                annulées.
                              </p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  disabled={deleting}
                                  onClick={() => handleDelete(r.id)}
                                  className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                  {deleting ? 'Suppression...' : 'Oui, supprimer'}
                                </button>
                                <button
                                  type="button"
                                  disabled={deleting}
                                  onClick={() => setConfirmId(null)}
                                  className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-slate-50"
                                >
                                  Garder
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}