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
    <div className="space-y-6 pb-28 lg:pb-0">
      <h1 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Réserver une leçon
      </h1>

      {noHours && (
        <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">
          Vous n'avez plus d'heures. Passez à l'agence pour faire créditer un forfait, vous
          pourrez ensuite réserver.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          {/* Moniteur */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-xl font-bold">Moniteur</h2>
            {instructors.loading && <p className="mt-3 text-slate-600">Chargement...</p>}
            {instructors.error && (
              <p role="alert" className="mt-3 text-red-700">
                {instructors.error}
              </p>
            )}
            {!instructors.loading && !instructors.error && list.length === 0 && (
              <p className="mt-3 text-slate-600">
                Aucun moniteur n'est disponible pour le moment.
              </p>
            )}
            <div
              className="mt-4 grid gap-3 sm:grid-cols-2"
              role="group"
              aria-label="Choisir un moniteur"
            >
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
            <h2 className="font-display text-xl font-bold">Jour</h2>
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
            <h2 className="font-display text-xl font-bold">Heure</h2>
            {!instructorId && (
              <p className="mt-3 text-slate-600">Choisissez d'abord un moniteur.</p>
            )}
            {instructorId && slots.loading && (
              <p className="mt-3 text-slate-600">Recherche des créneaux...</p>
            )}
            {slots.error && (
              <p role="alert" className="mt-3 text-red-700">
                {slots.error}
              </p>
            )}
            {instructorId && !slots.loading && !slots.error && slots.data && (
              slots.data.slots.length === 0 ? (
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
              )
            )}
          </section>
        </div>

        {/* Récapitulatif et confirmation (grands écrans) */}
        <aside className="hidden rounded-3xl bg-navy p-7 text-white lg:sticky lg:top-24 lg:block">
          <h2 className="font-display text-xl font-bold">Votre réservation</h2>

          {bookedAt ? (
            <div role="status" className="mt-4">
              <p className="rounded-xl bg-green-100 p-4 text-sm font-semibold text-green-900">
                Leçon réservée. Un email de confirmation vous a été envoyé.
              </p>
              <p className="mt-4 font-display text-xl font-bold capitalize">
                {formatDateTime(bookedAt)}
              </p>
              {instructor && (
                <p className="mt-1 text-white/80">
                  avec {instructor.firstName} {instructor.lastName}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/student/lessons"
                  className="rounded-lg bg-line px-5 py-3 text-center font-bold text-asphalt hover:brightness-95"
                >
                  Voir mes leçons
                </Link>
                <button
                  type="button"
                  onClick={() => setBookedAt(null)}
                  className="rounded-lg border border-white/40 px-5 py-3 font-semibold hover:bg-white/10"
                >
                  Réserver une autre leçon
                </button>
              </div>
            </div>
          ) : slot && instructor ? (
            <div className="mt-4">
              <p className="font-display text-2xl font-bold capitalize">{formatDateTime(slot)}</p>
              <p className="mt-1 text-white/80">
                avec {instructor.firstName} {instructor.lastName}
              </p>

              <dl className="mt-5 space-y-2 border-t border-white/15 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/70">Durée</dt>
                  <dd className="font-semibold">1 heure</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/70">Votre solde</dt>
                  <dd className="font-semibold">
                    {balance ?? '...'} h
                    {balance !== undefined && balance > 0 && (
                      <span className="text-white/70"> → {balance - 1} h</span>
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-white/70">
                Annulation gratuite jusqu'à 24 heures avant la leçon. Passé ce délai, l'heure
                n'est pas rendue. Un véhicule vous est attribué automatiquement.
              </p>

              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={confirm}
                disabled={submitting || noHours}
                className="mt-5 w-full rounded-lg bg-line py-3 font-bold text-asphalt hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Réservation...' : 'Confirmer la réservation'}
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-white/80">
                Choisissez un moniteur, un jour et une heure : le récapitulatif s'affiche ici.
              </p>
              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Barre de confirmation fixe en bas de l'écran (petits écrans) :
          le bouton est toujours visible, sans avoir à descendre dans la page */}
      {(bookedAt || (slot && instructor)) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_24px_-12px_rgba(21,28,38,0.35)] lg:hidden">
          {bookedAt ? (
            <div role="status" className="mx-auto flex max-w-xl items-center justify-between gap-3">
              <p className="text-sm font-semibold text-green-800">
                Leçon réservée. Email de confirmation envoyé.
              </p>
              <Link
                to="/student/lessons"
                className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white"
              >
                Mes leçons
              </Link>
            </div>
          ) : (
            slot &&
            instructor && (
              <div className="mx-auto max-w-xl">
                <p className="font-display text-lg font-bold capitalize">{formatDateTime(slot)}</p>
                <p className="text-sm text-slate-600">
                  avec {instructor.firstName} {instructor.lastName} · 1 heure
                </p>
                {error && (
                  <p role="alert" className="mt-2 rounded-lg bg-red-100 p-2 text-sm text-red-800">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={confirm}
                  disabled={submitting || noHours}
                  className="mt-3 w-full rounded-lg bg-signal py-3 font-bold text-white hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {noHours
                    ? "Plus d'heures disponibles"
                    : submitting
                      ? 'Réservation...'
                      : 'Confirmer la réservation'}
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}