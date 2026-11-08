import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { formatDateTime, formatShortDate } from '../../lib/format';
import type { Appointment, HoursMovementType, HoursResponse } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

const MOVEMENT_LABELS: Record<HoursMovementType, string> = {
  credit: 'Heures ajoutées',
  adjustment: 'Ajustement',
  booking: 'Leçon réservée',
  refund: 'Heure rendue',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const hours = useFetch<HoursResponse>('/me/hours');
  const lessons = useFetch<Appointment[]>('/appointments/mine');

  // Prochaine leçon : la plus proche parmi les leçons confirmées à venir
  const now = Date.now();
  const upcoming = (lessons.data ?? [])
    .filter((a) => a.status === 'confirmed' && new Date(a.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

  const balance = hours.data?.hoursBalance;

  return (
    <div className="space-y-6">
      <h1 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Bonjour {user?.firstName}
      </h1>

      {/* Alertes sur le solde */}
      {balance === 0 && (
        <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">
          Vous n'avez plus d'heures. Passez à l'agence pour faire créditer un forfait, vous
          pourrez ensuite réserver.
        </p>
      )}
      {balance !== undefined && balance > 0 && balance <= 2 && (
        <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">
          Il vous reste peu d'heures. Pensez à faire créditer un nouveau forfait.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Solde d'heures */}
        <section className="rounded-3xl bg-navy p-7 text-white">
          <h2 className="text-sm font-semibold text-white/80">Heures restantes</h2>
          {hours.loading ? (
            <p className="mt-4 text-white/70">Chargement...</p>
          ) : hours.error ? (
            <p role="alert" className="mt-4 text-red-200">
              {hours.error}
            </p>
          ) : (
            <p className="mt-2 font-display text-7xl font-extrabold text-line">
              {balance}
              <span className="ml-2 text-2xl font-bold text-white">h</span>
            </p>
          )}
          <Link
            to="/student/book"
            className="mt-6 inline-block rounded-lg bg-line px-5 py-3 font-bold text-asphalt hover:brightness-95"
          >
            Réserver une leçon
          </Link>
        </section>

        {/* Prochaine leçon */}
        <section className="rounded-3xl border border-slate-200 bg-white p-7">
          <h2 className="text-sm font-semibold text-slate-500">Prochaine leçon</h2>
          {lessons.loading ? (
            <p className="mt-4 text-slate-600">Chargement...</p>
          ) : lessons.error ? (
            <p role="alert" className="mt-4 text-red-700">
              {lessons.error}
            </p>
          ) : upcoming ? (
            <div className="mt-3">
              <p className="font-display text-2xl font-bold capitalize">
                {formatDateTime(upcoming.startsAt)}
              </p>
              <p className="mt-3 text-slate-700">
                Moniteur : {upcoming.instructor.firstName} {upcoming.instructor.lastName}
              </p>
              <p className="text-slate-700">
                Véhicule : {upcoming.vehicle.model} ({upcoming.vehicle.plateNumber})
              </p>
              <Link
                to="/student/lessons"
                className="mt-5 inline-block text-sm font-semibold text-signal underline"
              >
                Voir mes leçons
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-lg text-slate-700">Aucune leçon prévue pour le moment.</p>
              <Link
                to="/student/book"
                className="mt-4 inline-block text-sm font-semibold text-signal underline"
              >
                Réserver ma première leçon
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Derniers mouvements d'heures */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7">
        <h2 className="font-display text-xl font-bold">Derniers mouvements</h2>
        {hours.data && hours.data.history.length === 0 && (
          <p className="mt-3 text-slate-600">Aucun mouvement pour le moment.</p>
        )}
        {hours.data && hours.data.history.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100">
            {hours.data.history.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{MOVEMENT_LABELS[m.type]}</p>
                  <p className="text-sm text-slate-500">{formatShortDate(m.createdAt)}</p>
                </div>
                <p
                  className={`font-display text-lg font-bold ${
                    m.amount > 0 ? 'text-green-700' : 'text-slate-700'
                  }`}
                >
                  {m.amount > 0 ? '+' : ''}
                  {m.amount} h
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}