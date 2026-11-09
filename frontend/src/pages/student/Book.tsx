import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { formatDateTime, formatTime, nextDays } from '../../lib/format';
import type { HoursResponse, Instructor, SlotsResponse } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

export default function Book() {
  const days = useMemo(() => nextDays(14), []);
  const instructors = useFetch<Instructor[]>('/instructors');
  const hours = useFetch<HoursResponse>('/me/hours');

  const [pickedInstructor, setPickedInstructor] = useState('');
  const [date, setDate] = useState(days[0].date);
  const [slot, setSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookedAt, setBookedAt] = useState<string | null>(null);

  // S'il n'y a qu'un seul moniteur, il est choisi d'office
  const list = instructors.data ?? [];
  const instructorId = pickedInstructor || (list.length === 1 ? list[0].id : '');
  const instructor = list.find((i) => i.id === instructorId);

  const slots = useFetch<SlotsResponse>(
    instructorId ? `/slots?instructorId=${instructorId}&date=${date}` : null,
  );

  const balance = hours.data?.hoursBalance;
  const noHours = balance !== undefined && balance <= 0;
  const ready = Boolean(slot && instructor);

  function resetChoice() {
    setSlot(null);
    setError('');
    setBookedAt(null);
  }

  function chooseInstructor(id: string) {
    setPickedInstructor(id);
    resetChoice();
  }

  function chooseDate(next: string) {
    setDate(next);
    resetChoice();
  }

  async function confirm() {
    if (!slot || !instructorId) return;
    setSubmitting(true);
    setError('');
    try {
      await api('/appointments', {
        method: 'POST',
        body: { instructorId, startsAt: slot },
      });
      setBookedAt(slot);
      setSlot(null);
      hours.reload();
      slots.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        // Créneau pris entre-temps : on recharge la liste
        if (err.status === 409) {
          setSlot(null);
          slots.reload();
        }
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // pb-48 : laisse la place à la barre de confirmation fixée en bas de l'écran
    <div className="mx-auto max-w-3xl space-y-6 pb-48">
      <h1 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Réserver une leçon
      </h1>

      {noHours && (
        <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">
          Vous n'avez plus d'heures. Passez à l'agence pour faire créditer un forfait, vous
          pourrez ensuite réserver.
        </p>
      )}

      {/* Moniteur */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold">1. Moniteur</h2>
        {instructors.loading && <p className="mt-3 text-slate-600">Chargement...</p>}
        {instructors.error && (
          <p role="alert" className="mt-3 text-red-700">
            {instructors.error}
          </p>
        )}
        {!instructors.loading && !instructors.error && list.length === 0 && (
          <p className="mt-3 text-slate-600">Aucun moniteur n'est disponible pour le moment.</p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="group" aria-label="Choisir un moniteur">
          {list.map((i) => {
            const selected = i.id === instructorId;
            return (
              <button
                key={i.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseInstructor(i.id)}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  selected
                    ? 'border-navy bg-navy text-white'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                    selected ? 'bg-line text-asphalt' : 'bg-navy text-line'
                  }`}
                  aria-hidden="true"
                >
                  {i.firstName[0]}
                  {i.lastName[0]}
                </span>
                <span>
                  <span className="block font-semibold">
                    {i.firstName} {i.lastName}
                  </span>
                  <span className={`block text-sm ${selected ? 'text-white/70' : 'text-slate-500'}`}>
                    Moniteur
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Jour */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold">2. Jour</h2>
        <div
          className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2"
          role="group"
          aria-label="Choisir un jour"
        >
          {days.map((d) => (
            <button
              key={d.date}
              type="button"
              aria-pressed={d.date === date}
              onClick={() => chooseDate(d.date)}
              className={`min-w-[4.5rem] rounded-xl border px-3 py-2.5 text-center transition-colors ${
                d.date === date
                  ? 'border-navy bg-navy text-white'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="block text-xs capitalize">{d.weekday}</span>
              <span className="block font-display text-2xl font-bold leading-tight">{d.day}</span>
              <span className="block text-xs">{d.month}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Heure */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold">3. Heure</h2>
        {!instructorId && <p className="mt-3 text-slate-600">Choisissez d'abord un moniteur.</p>}
        {instructorId && slots.loading && (
          <p className="mt-3 text-slate-600">Recherche des créneaux...</p>
        )}
        {slots.error && (
          <p role="alert" className="mt-3 text-red-700">
            {slots.error}
          </p>
        )}
        {instructorId &&
          !slots.loading &&
          !slots.error &&
          slots.data &&
          (slots.data.slots.length === 0 ? (
            <p className="mt-3 text-slate-600">
              Aucun créneau libre ce jour-là. Essayez un autre jour.
            </p>
          ) : (
            <div
              className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4"
              role="group"
              aria-label="Choisir une heure"
            >
              {slots.data.slots.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  aria-pressed={slot === s.startsAt}
                  onClick={() => {
                    setSlot(s.startsAt);
                    setError('');
                    setBookedAt(null);
                  }}
                  className={`rounded-xl border py-3 font-semibold transition-colors ${
                    slot === s.startsAt
                      ? 'border-signal bg-signal text-white'
                      : 'border-slate-300 hover:border-signal hover:text-signal'
                  }`}
                >
                  {formatTime(s.startsAt)}
                </button>
              ))}
            </div>
          ))}
      </section>

      {/* Barre de confirmation : toujours en bas de l'écran, sur tous les écrans */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white shadow-[0_-10px_30px_-15px_rgba(21,28,38,0.4)]">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          {error && (
            <p role="alert" className="mb-3 rounded-lg bg-red-100 p-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {bookedAt ? (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
            >
              <div>
                <p className="font-semibold text-green-800">
                  Leçon réservée. Un email de confirmation vous a été envoyé.
                </p>
                <p className="text-sm capitalize text-slate-600">{formatDateTime(bookedAt)}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/student/lessons"
                  className="rounded-lg bg-navy px-5 py-3 font-bold text-white hover:bg-navy/90"
                >
                  Voir mes leçons
                </Link>
                <button
                  type="button"
                  onClick={() => setBookedAt(null)}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50"
                >
                  Réserver une autre leçon
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                {ready && slot && instructor ? (
                  <>
                    <p className="font-display text-lg font-bold capitalize">
                      {formatDateTime(slot)}
                    </p>
                    <p className="text-sm text-slate-600">
                      avec {instructor.firstName} {instructor.lastName} · 1 heure
                      {balance !== undefined && balance > 0 && (
                        <> · solde : {balance} h → {balance - 1} h</>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Annulation gratuite jusqu'à 24 heures avant la leçon.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-600">
                    Choisissez un moniteur, un jour et une heure pour réserver.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={confirm}
                disabled={!ready || submitting || noHours}
                className="w-full rounded-lg bg-signal px-8 py-3 font-bold text-white hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {noHours
                  ? "Plus d'heures disponibles"
                  : submitting
                    ? 'Réservation...'
                    : 'Confirmer la réservation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}