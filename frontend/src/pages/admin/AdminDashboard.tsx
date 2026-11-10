import { useMemo } from 'react';
import { formatTime, weekDays } from '../../lib/format';
import type {
  AdminAppointmentsResponse,
  AdminStats,
  AppointmentStatus,
} from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

const STATUS: Record<AppointmentStatus, { label: string; style: string }> = {
  confirmed: { label: 'Confirmée', style: 'bg-blue-100 text-blue-900' },
  completed: { label: 'Effectuée', style: 'bg-green-100 text-green-900' },
  no_show: { label: 'Absence', style: 'bg-amber-100 text-amber-900' },
  cancelled: { label: 'Annulée', style: 'bg-slate-200 text-slate-700' },
};

function Kpi({
  label,
  value,
  hint,
  dark = false,
}: {
  label: string;
  value: string;
  hint?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-6 ${
        dark ? 'bg-navy text-white' : 'border border-slate-200 bg-white'
      }`}
    >
      <p className={`text-sm font-semibold ${dark ? 'text-white/80' : 'text-slate-500'}`}>
        {label}
      </p>
      <p
        className={`mt-2 font-display text-5xl font-extrabold ${dark ? 'text-line' : 'text-asphalt'}`}
      >
        {value}
      </p>
      {hint && <p className={`mt-1 text-sm ${dark ? 'text-white/70' : 'text-slate-500'}`}>{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  // Aujourd'hui et le mois en cours, dans le fuseau de l'auto-école
  const { today, monthStart, monthEnd, monthLabel } = useMemo(() => {
    const day = weekDays(0).find((d) => d.isToday)!;
    const [y, m] = day.date.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = String(m).padStart(2, '0');
    return {
      today: day.date,
      monthStart: `${y}-${mm}-01`,
      monthEnd: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
      monthLabel: `${day.monthLong} ${y}`,
    };
  }, []);

  const stats = useFetch<AdminStats>(`/admin/stats?from=${monthStart}&to=${monthEnd}`);
  const todays = useFetch<AdminAppointmentsResponse>(
    `/admin/appointments?from=${today}&to=${today}&limit=100`,
  );
  // Leçons confirmées de ce mois déjà commencées : les moniteurs doivent les clôturer
  const pending = useFetch<AdminAppointmentsResponse>(
    `/admin/appointments?status=confirmed&from=${monthStart}&to=${today}&limit=100`,
  );

  const now = Date.now();
  const todayLessons = (todays.data?.items ?? [])
    .filter((a) => a.status !== 'cancelled')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const toClose = (pending.data?.items ?? []).filter(
    (a) => new Date(a.startsAt).getTime() <= now,
  );

  const data = stats.data;
  const lessons = data
    ? data.byStatus.confirmed + data.byStatus.completed + data.byStatus.no_show
    : 0;
  const maxLessons = Math.max(1, ...(data?.lessonsPerInstructor.map((i) => i.lessons) ?? [1]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tableau de bord
        </h1>
        <p className="mt-1 capitalize text-slate-600">{monthLabel}</p>
      </div>

      {stats.error && (
        <p role="alert" className="text-red-700">
          {stats.error}
        </p>
      )}

      {/* Chiffres du mois */}
      <section aria-label="Chiffres du mois" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          dark
          label="Taux de remplissage"
          value={data ? `${data.fillRate} %` : '...'}
          hint={data ? `${data.bookedSlots} réservés sur ${data.offeredSlots} proposés` : undefined}
        />

        <Kpi label="Leçons ce mois" value={data ? String(lessons) : '...'} hint="hors annulées" />
        <Kpi
          label="Annulations"
          value={data ? String(data.byStatus.cancelled) : '...'}
          hint="ce mois"
        />
        <Kpi
          label="Absences d'élèves"
          value={data ? String(data.byStatus.no_show) : '...'}
          hint="ce mois"
        />
      </section>

      {/* Alerte : leçons à clôturer */}
      {toClose.length > 0 && (
        <p role="status" className="rounded-2xl bg-amber-100 p-4 text-amber-900">
          <span className="font-bold">
            {toClose.length} leçon{toClose.length > 1 ? 's' : ''} à clôturer
          </span>{' '}
          par les moniteurs : elles ont commencé mais ne sont pas encore marquées comme
          effectuées ou absentes.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Leçons du jour */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">Leçons d'aujourd'hui</h2>
          {todays.loading && <p className="mt-3 text-slate-600">Chargement...</p>}
          {todays.error && (
            <p role="alert" className="mt-3 text-red-700">
              {todays.error}
            </p>
          )}
          {todays.data && todayLessons.length === 0 && (
            <p className="mt-3 text-slate-500">Aucune leçon aujourd'hui.</p>
          )}
          <ul className="mt-4 divide-y divide-slate-100">
            {todayLessons.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5"
              >
                <div className="flex items-center gap-4">
                  <p className="w-24 font-display text-lg font-bold">{formatTime(a.startsAt)}</p>
                  <div>
                    <p className="font-semibold">
                      {a.student.firstName} {a.student.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      avec {a.instructor.firstName} {a.instructor.lastName} ·{' '}
                      {a.vehicle.plateNumber}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS[a.status].style}`}
                >
                  {STATUS[a.status].label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Leçons par moniteur */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">Leçons par moniteur</h2>
          {stats.loading && <p className="mt-3 text-slate-600">Chargement...</p>}
          {data && data.lessonsPerInstructor.length === 0 && (
            <p className="mt-3 text-slate-500">Aucune leçon ce mois-ci.</p>
          )}
          <ul className="mt-4 space-y-4">
            {(data?.lessonsPerInstructor ?? []).map((i) => (
              <li key={i.instructorId}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold">{i.name}</p>
                  <p className="font-display text-lg font-bold">{i.lessons}</p>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-signal"
                    style={{ width: `${(i.lessons / maxLessons) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}