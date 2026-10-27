import type { Task, TaskStats, TaskType, TypeBreakdown } from '../types';
import { fromISODate, isoWeekOf } from './date';

/** Miroir de `REWARD_TARGET_RATIO` côté backend, exprimé en pourcentage entier. */
export const REWARD_TARGET_PERCENT = 80;

// Calcul entier pour éviter les erreurs d'arrondi flottant (0.8 × 35 = 28.000000000000004).
export const targetPoints = (plannedPoints: number) => Math.ceil((plannedPoints * REWARD_TARGET_PERCENT) / 100);

export const isUnlocked = (donePoints: number, target: number) => target > 0 && donePoints >= target;

/** Rang d'affichage : urgentes sans horaire en tête, puis tâches horodatées, puis le reste. */
const displayRank = (t: Task) => (t.start_time ? 1 : t.task_type === 'urgent' ? 0 : 2);

export function compareTasks(a: Task, b: Task) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const rank = displayRank(a) - displayRank(b);
  if (rank !== 0) return rank;
  if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
  return a.created_at.localeCompare(b.created_at);
}

export const sumWeights = (tasks: Task[]) => tasks.reduce((sum, t) => sum + t.weight, 0);

export const donePoints = (tasks: Task[]) => sumWeights(tasks.filter((t) => t.is_done));

export const tasksOfWeek = (tasks: Task[], year: number, week: number) =>
  tasks.filter((t) => {
    const w = isoWeekOf(fromISODate(t.date));
    return w.year === year && w.week === week;
  });

export const rate = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

/** Agrégats de suivi d'un ensemble de tâches (jour ou semaine). */
export function summarize(tasks: Task[]): TaskStats {
  const by_type = Object.fromEntries(TASK_TYPES.map((type) => [type, { total: 0, done: 0 }])) as TypeBreakdown;
  let done = 0;
  for (const t of tasks) {
    by_type[t.task_type].total++;
    if (t.is_done) {
      by_type[t.task_type].done++;
      done++;
    }
  }
  return {
    tasks_total: tasks.length,
    tasks_done: done,
    completion_rate: rate(done, tasks.length),
    points_planned: sumWeights(tasks),
    points_done: donePoints(tasks),
    by_type,
  };
}

interface TaskTypeMeta {
  label: string;
  emoji: string;
  hint: string;
  dot: string;
  soft: string;
  text: string;
  border: string;
  borderStrong: string;
  checked: string;
}

// Classes écrites en entier pour que Tailwind les détecte.
export const TASK_TYPE_META: Record<TaskType, TaskTypeMeta> = {
  urgent: {
    label: 'Urgente',
    emoji: '🟠',
    hint: 'À traiter en priorité',
    dot: 'bg-urgent',
    soft: 'bg-urgent-soft',
    text: 'text-urgent-ink',
    border: 'border-urgent/25',
    borderStrong: 'border-urgent',
    checked: 'bg-urgent border-urgent',
  },
  mandatory: {
    label: 'Obligatoire',
    emoji: '🔴',
    hint: 'Impact fort sur l’organisation',
    dot: 'bg-mandatory',
    soft: 'bg-mandatory-soft',
    text: 'text-mandatory-ink',
    border: 'border-mandatory/25',
    borderStrong: 'border-mandatory',
    checked: 'bg-mandatory border-mandatory',
  },
  optional: {
    label: 'Optionnelle',
    emoji: '🔵',
    hint: 'Bonus, si le temps le permet',
    dot: 'bg-optional',
    soft: 'bg-optional-soft',
    text: 'text-optional-ink',
    border: 'border-optional/25',
    borderStrong: 'border-optional',
    checked: 'bg-optional border-optional',
  },
  fixed: {
    label: 'Fixe',
    emoji: '🟣',
    hint: 'Événement ancré dans le temps',
    dot: 'bg-fixed',
    soft: 'bg-fixed-soft',
    text: 'text-fixed-ink',
    border: 'border-fixed/25',
    borderStrong: 'border-fixed',
    checked: 'bg-fixed border-fixed',
  },
};

export const TASK_TYPES: TaskType[] = ['urgent', 'mandatory', 'optional', 'fixed'];
