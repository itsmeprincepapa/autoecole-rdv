import { useMemo, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { formatTime, toLocalDate, weekDays } from '../../lib/format';
import type {
  AppointmentStatus,
  ScheduleAppointment,
  ScheduleResponse,
} from '../../lib/types';
import { useFetch } from '../../lib/useFetch';
import CloseLessonForm from './CloseLessonForm';

const STATUS: Record<AppointmentStatus, { label: string; style: string }> = {
  confirmed: { label: 'Confirmée', style: 'bg-blue-100 text-blue-900' },
  completed: { label: 'Effectuée', style: 'bg-green-100 text-green-900' },
  no_show: { label: 'Absence', style: 'bg-amber-100 text-amber-900' },
  cancelled: { label: 'Annulée', style: 'bg-slate-200 text-slate-700' },
};

export default function Planning() {
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  // Leçon dont le formulaire est ouvert, et son mode
  const [open, setOpen] = useState<{ id: string; mode: 'close' | 'evaluate' } | null>(null);
  const [notice, setNotice] = useState('');

  const days = useMemo(() => weekDays(offset), [offset]);
  const first = days[0];
  const last = days[6];

  const schedule = useFetch<ScheduleResponse>(
    user ? `/instructors/${user.id}/schedule?from=${first.date}&to=${last.date}` : null,
  );

  // Les leçons sont rangées par jour (date locale de l'auto-école)
  const byDay = new Map<string, ScheduleAppointment[]>();
  for (const lesson of schedule.data?.appointments ?? []) {
    const key = toLocalDate(lesson.startsAt);
    byDay.set(key, [...(byDay.get(key) ?? []), lesson]);
  }

  const total = schedule.data?.appointments.length ?? 0;
  const now = Date.now();

  function changeWeek(next: number) {
    setOffset(next);
    setOpen(null);
    setNotice('');
  }

  function handleDone(message: string) {
    setNotice(message);
    setOpen(null);
    schedule.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Mon planning
          </h1>
          <p className="mt-1 text-slate-600">
            Du {first.day} {first.month} au {last.day} {last.month}
            {schedule.data && ` · ${total} leçon${total > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2" role="group" aria-label="Changer de semaine">
          <button
            type="button"
            onClick={() => changeWeek(offset - 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Semaine précédente
          </button>
          <button
            type="button"
            onClick={() => changeWeek(0)}
            disabled={offset === 0}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Cette semaine
          </button>
          <button
            type="button"
            onClick={() => changeWeek(offset + 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Semaine suivante
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-green-100 p-4 text-sm font-semibold text-green-900">
          {notice}
        </p>
      )}

      {schedule.loading && <p className="text-slate-600">Chargement...</p>}
      {schedule.error && (
        <p role="alert" className="text-red-700">
          {schedule.error}
        </p>
      )}

      {schedule.data && (
        <ul className="space-y-4">
          {days.map((day) => {
            const lessons = byDay.get(day.date) ?? [];
            return (
              <li
                key={day.date}
                className={`rounded-3xl border bg-white p-6 ${
                  day.isToday ? 'border-navy ring-2 ring-navy/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-xl font-bold capitalize">
                    {day.weekdayLong} {day.day} {day.monthLong}
                  </h2>
                  {day.isToday && (
                    <span className="rounded-full bg-navy px-3 py-0.5 text-xs font-bold text-line">
                      Aujourd'hui
                    </span>
                  )}
                </div>

                {lessons.length === 0 ? (
                  <p className="mt-3 text-slate-500">Aucune leçon.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {lessons.map((lesson) => {
                      // Une leçon commencée et non clôturée doit être clôturée
                      const canClose =
                        lesson.status === 'confirmed' &&
                        new Date(lesson.startsAt).getTime() <= now;
                      const canEvaluate = lesson.status === 'completed';
                      const status = canClose
                        ? { label: 'À clôturer', style: 'bg-amber-100 text-amber-900' }
                        : STATUS[lesson.status];
                      const isOpen = open?.id === lesson.id;

                      return (
                        <li key={lesson.id} className="py-4">
                          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                            <div className="flex items-center gap-4">
                              <p className="w-28 font-display text-lg font-bold">
                                {formatTime(lesson.startsAt)} – {formatTime(lesson.endsAt)}
                              </p>
                              <div>
                                <p className="font-semibold">
                                  {lesson.student.firstName} {lesson.student.lastName}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {lesson.vehicle.model} ({lesson.vehicle.plateNumber})
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${status.style}`}
                              >
                                {status.label}
                              </span>
                              {!isOpen && canClose && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpen({ id: lesson.id, mode: 'close' });
                                    setNotice('');
                                  }}
                                  className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy/90"
                                >
                                  Clôturer la leçon
                                </button>
                              )}
                              {!isOpen && canEvaluate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpen({ id: lesson.id, mode: 'evaluate' });
                                    setNotice('');
                                  }}
                                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                                >
                                  Évaluer les compétences
                                </button>
                              )}
                            </div>
                          </div>

                          {isOpen && open && (
                            <CloseLessonForm
                              lesson={lesson}
                              mode={open.mode}
                              onDone={handleDone}
                              onCancel={() => setOpen(null)}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}