import { useState } from 'react';
import { Link } from 'react-router-dom';

// Aperçu interactif de la réservation, avec des créneaux d'exemple.
// Il ne contacte pas le serveur : la vraie réservation demande un compte.

const HOURS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

// Créneaux déjà pris pour chacun des 5 jours affichés (exemple fixe)
const TAKEN: string[][] = [
  ['09:00', '15:00'],
  ['08:00', '10:00', '11:00'],
  ['14:00'],
  ['09:00', '10:00', '16:00'],
  ['08:00', '15:00', '16:00'],
];

const START_BALANCE = 20;

// Les 5 prochains jours ouvrés (hors dimanche), à partir de demain
function nextWorkingDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
  }
  return days;
}

const shortWeekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const fullDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function SlotPicker() {
  const [days] = useState(() => nextWorkingDays(5));
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  function selectDay(index: number) {
    setDayIndex(index);
    setSlot(null);
    setBooked(false);
  }

  function reset() {
    setSlot(null);
    setBooked(false);
  }

  const taken = TAKEN[dayIndex];
  const balance = booked ? START_BALANCE - 1 : START_BALANCE;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(21,28,38,0.45)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-asphalt text-sm font-bold text-line"
            aria-hidden="true"
          >
            CS
          </span>
          <div>
            <p className="font-semibold leading-tight">Cheikh S.</p>
            <p className="text-sm text-slate-500">Moniteur</p>
          </div>
        </div>
        <p className="rounded-full bg-mist px-3 py-1 text-sm font-medium">
          Solde : <span className="font-bold">{balance} h</span>
        </p>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2" role="group" aria-label="Choisir un jour">
        {days.map((day, index) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => selectDay(index)}
            aria-pressed={dayIndex === index}
            className={`rounded-lg border px-1 py-2 text-center transition-colors ${
              dayIndex === index
                ? 'border-asphalt bg-asphalt text-white'
                : 'border-slate-200 hover:border-slate-400'
            }`}
          >
            <span className="block text-xs capitalize">
              {shortWeekday.format(day).replace('.', '')}
            </span>
            <span className="block text-lg font-bold leading-tight">{day.getDate()}</span>
          </button>
        ))}
      </div>

      {booked && slot ? (
        <div role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-900">
          <p className="font-semibold">Leçon réservée (exemple)</p>
          <p className="mt-1">
            <span className="capitalize">{fullDate.format(days[dayIndex])}</span> à {slot}, avec
            Cheikh S.
          </p>
          <p className="mt-1">Une heure est retirée : il vous en resterait {balance}.</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="rounded-lg bg-signal px-4 py-2 font-semibold text-white hover:bg-signal-dark"
            >
              Créer mon compte
            </Link>
            <button type="button" onClick={reset} className="font-medium underline">
              Choisir un autre créneau
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-5 text-sm font-medium text-slate-600">Créneaux d'une heure</p>
          <div
            className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4"
            role="group"
            aria-label="Choisir une heure"
          >
            {HOURS.map((hour) => {
              const isTaken = taken.includes(hour);
              const isSelected = slot === hour;
              return (
                <button
                  key={hour}
                  type="button"
                  disabled={isTaken}
                  onClick={() => setSlot(hour)}
                  aria-pressed={isSelected}
                  className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                    isTaken
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 line-through'
                      : isSelected
                        ? 'border-signal bg-signal text-white'
                        : 'border-slate-300 hover:border-signal hover:text-signal'
                  }`}
                >
                  {hour}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!slot}
            onClick={() => setBooked(true)}
            className="mt-5 w-full rounded-lg bg-signal py-2.5 font-semibold text-white hover:bg-signal-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {slot ? `Réserver ${slot}` : 'Choisissez un créneau'}
          </button>
        </>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Aperçu : les créneaux affichés sont des exemples.
      </p>
    </div>
  );
}