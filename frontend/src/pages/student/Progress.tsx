import { Link } from 'react-router-dom';
import { formatDateTime } from '../../lib/format';
import type { LogbookResponse } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

const LEVEL_LABELS = [
  'Pas encore évalué',
  'À découvrir',
  'En cours d’acquisition',
  'Acquis avec aide',
  'Maîtrisé',
];

function Meter({ level }: { level: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Niveau ${level} sur 4`}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`h-2.5 w-8 rounded-full ${n <= level ? 'bg-signal' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function Progress() {
  const logbook = useFetch<LogbookResponse>('/me/logbook');

  const skills = logbook.data?.skills ?? [];
  const mastered = skills.filter((s) => s.level === 4).length;
  const evaluated = skills.filter((s) => s.level > 0).length;
  // Avancement global : somme des niveaux sur le maximum possible
  const percent =
    skills.length > 0
      ? Math.round((skills.reduce((sum, s) => sum + s.level, 0) / (skills.length * 4)) * 100)
      : 0;

  const lessonsWithNotes = (logbook.data?.lessons ?? []).filter((l) => l.notes);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Ma progression
      </h1>

      {logbook.loading && <p className="text-slate-600">Chargement...</p>}
      {logbook.error && (
        <p role="alert" className="text-red-700">
          {logbook.error}
        </p>
      )}

      {logbook.data && (
        <>
          {/* Avancement global */}
          <section className="rounded-3xl bg-navy p-7 text-white">
            <h2 className="text-sm font-semibold text-white/80">Compétences maîtrisées</h2>
            <p className="mt-2 font-display text-6xl font-extrabold text-line">
              {mastered}
              <span className="ml-2 text-2xl font-bold text-white">
                sur {skills.length}
              </span>
            </p>
            <div
              className="mt-5 h-3 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-label="Avancement global"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-line transition-[width] duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-white/70">
              Avancement global : {percent} %
            </p>
          </section>

          {evaluated === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-slate-700">
                Votre moniteur n'a pas encore évalué vos compétences. Elles apparaîtront ici
                après votre première leçon.
              </p>
              <Link
                to="/student/book"
                className="mt-4 inline-block text-sm font-semibold text-signal underline"
              >
                Réserver une leçon
              </Link>
            </div>
          ) : null}

          {/* Compétences */}
          <section className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="font-display text-xl font-bold">Vos compétences</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {skills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4"
                >
                  <div>
                    <p className="font-semibold">{skill.name}</p>
                    <p className="text-sm text-slate-500">{LEVEL_LABELS[skill.level]}</p>
                  </div>
                  <Meter level={skill.level} />
                </li>
              ))}
            </ul>
          </section>

          {/* Observations des moniteurs */}
          <section className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="font-display text-xl font-bold">Observations de vos moniteurs</h2>
            {lessonsWithNotes.length === 0 ? (
              <p className="mt-3 text-slate-600">Aucune observation pour le moment.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {lessonsWithNotes.map((lesson) => (
                  <li key={lesson.id} className="rounded-xl bg-mist p-4">
                    <p className="text-sm font-semibold capitalize">
                      {formatDateTime(lesson.startsAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-slate-700">{lesson.notes}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}