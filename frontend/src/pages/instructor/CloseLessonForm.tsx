import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import type { ScheduleAppointment, Skill } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

const LEVELS = [
  { value: 1, label: 'À découvrir' },
  { value: 2, label: 'En cours' },
  { value: 3, label: 'Acquis avec aide' },
  { value: 4, label: 'Maîtrisé' },
];

interface CloseLessonFormProps {
  lesson: ScheduleAppointment;
  // close : clôturer la leçon (et évaluer) / evaluate : évaluer une leçon déjà effectuée
  mode: 'close' | 'evaluate';
  onDone: (message: string) => void;
  onCancel: () => void;
}

export default function CloseLessonForm({ lesson, mode, onDone, onCancel }: CloseLessonFormProps) {
  const skills = useFetch<Skill[]>('/skills');
  const [status, setStatus] = useState<'completed' | 'no_show'>('completed');
  const [notes, setNotes] = useState('');
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const closing = mode === 'close';
  // Les compétences ne s'évaluent que si la leçon a eu lieu
  const showSkills = !closing || status === 'completed';

  function pickLevel(skillId: string, value: number) {
    setLevels((current) => {
      const next = { ...current };
      // Un second clic sur le même niveau le retire
      if (next[skillId] === value) delete next[skillId];
      else next[skillId] = value;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const evaluations = Object.entries(levels).map(([skillId, level]) => ({ skillId, level }));
    if (!closing && evaluations.length === 0) {
      setError('Choisissez au moins un niveau.');
      return;
    }

    setSubmitting(true);
    let closed = false;
    try {
      if (closing) {
        await api(`/appointments/${lesson.id}/complete`, {
          method: 'POST',
          body: { status, ...(notes.trim() ? { notes: notes.trim() } : {}) },
        });
        closed = true;
      }
      if (showSkills && evaluations.length > 0) {
        await api(`/appointments/${lesson.id}/evaluations`, {
          method: 'POST',
          body: { evaluations },
        });
      }
      onDone(
        closing
          ? status === 'completed'
            ? 'Leçon clôturée.'
            : 'Absence enregistrée.'
          : 'Évaluation enregistrée.',
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Une erreur est survenue';
      if (closed) {
        // La leçon est clôturée : seule l'évaluation a échoué
        onDone(
          `Leçon clôturée, mais l'évaluation n'a pas été enregistrée (${message}). Utilisez « Évaluer les compétences ».`,
        );
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-5 rounded-2xl bg-mist p-5"
      aria-label={closing ? 'Clôturer la leçon' : 'Évaluer les compétences'}
    >
      {closing && (
        <>
          <fieldset>
            <legend className="font-semibold">Que s'est-il passé ?</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(
                [
                  ['completed', 'Leçon effectuée'],
                  ['no_show', "L'élève était absent"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${
                    status === value
                      ? 'border-navy bg-navy text-white'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name={`status-${lesson.id}`}
                    value={value}
                    checked={status === value}
                    onChange={() => setStatus(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={`notes-${lesson.id}`} className="block font-semibold">
              Observations (facultatif)
            </label>
            <textarea
              id={`notes-${lesson.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Ce qui a été travaillé, ce qu'il reste à revoir..."
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
            <p className="mt-1 text-xs text-slate-500">{notes.length} / 1000 caractères</p>
          </div>
        </>
      )}

      {showSkills && (
        <div>
          <p className="font-semibold">
            Compétences travaillées {closing && <span className="font-normal">(facultatif)</span>}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            1 = à découvrir, 2 = en cours, 3 = acquis avec aide, 4 = maîtrisé. Cliquez une
            seconde fois sur un niveau pour le retirer.
          </p>

          {skills.loading && <p className="mt-3 text-slate-600">Chargement...</p>}
          {skills.error && (
            <p role="alert" className="mt-3 text-red-700">
              {skills.error}
            </p>
          )}
          <ul className="mt-3 divide-y divide-slate-200">
            {(skills.data ?? []).map((skill) => (
              <li
                key={skill.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5"
              >
                <span className="font-medium">{skill.name}</span>
                <div className="flex gap-1.5" role="group" aria-label={`Niveau : ${skill.name}`}>
                  {LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      title={level.label}
                      aria-label={`${level.value} : ${level.label}`}
                      aria-pressed={levels[skill.id] === level.value}
                      onClick={() => pickLevel(skill.id, level.value)}
                      className={`h-9 w-9 rounded-lg border text-sm font-bold ${
                        levels[skill.id] === level.value
                          ? 'border-signal bg-signal text-white'
                          : 'border-slate-300 bg-white hover:border-signal'
                      }`}
                    >
                      {level.value}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-signal px-5 py-2.5 font-bold text-white hover:bg-signal-dark disabled:opacity-60"
        >
          {submitting ? 'Enregistrement...' : closing ? 'Enregistrer' : "Enregistrer l'évaluation"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold hover:bg-slate-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}