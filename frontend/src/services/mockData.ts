import { addDays, startOfISOWeek } from 'date-fns';
import type { Task, TaskType, WeeklyReward } from '../types';
import { isoWeekOf, timeToMinutes, toISODate } from '../utils/date';
import { isUnlocked, summarize, targetPoints, tasksOfWeek } from '../utils/tasks';

interface Template {
  title: string;
  description?: string;
  start?: string;
  end?: string;
  type: TaskType;
  weight: number;
}

// Une semaine type (lundi → dimanche), répliquée autour de la semaine courante.
const WEEK_TEMPLATE: Template[][] = [
  [
    { title: 'Stand-up équipe', start: '09:00', end: '09:30', type: 'fixed', weight: 1 },
    { title: 'Rédiger le rapport mensuel', description: 'Chiffres clés + points de blocage.', start: '10:00', end: '12:00', type: 'mandatory', weight: 3 },
    { title: 'Pause déjeuner', start: '12:30', end: '13:30', type: 'fixed', weight: 1 },
    { title: 'Lire un chapitre de livre', type: 'optional', weight: 1 },
    { title: 'Répondre au client mécontent', description: 'Ticket #1287, escalade du support.', type: 'urgent', weight: 3 },
  ],
  [
    { title: 'Rendez-vous dentiste', description: 'Cabinet Dr Martin, 2e étage.', start: '08:30', end: '09:15', type: 'fixed', weight: 2 },
    { title: 'Revue de code PR #42', start: '14:00', end: '15:30', type: 'mandatory', weight: 2 },
    { title: 'Courses de la semaine', start: '18:00', end: '19:00', type: 'mandatory', weight: 2 },
    { title: 'Séance de yoga', start: '19:30', end: '20:30', type: 'optional', weight: 2 },
  ],
  [
    { title: 'Corriger le bug en production', start: '09:00', end: '10:30', type: 'urgent', weight: 4 },
    { title: 'Réunion client', start: '11:00', end: '12:00', type: 'fixed', weight: 2 },
    { title: 'Préparer la présentation', description: 'Slides pour le comité de vendredi.', start: '14:00', end: '16:00', type: 'mandatory', weight: 5 },
    { title: 'Ranger le bureau', type: 'optional', weight: 1 },
  ],
  [
    { title: 'Footing', start: '07:00', end: '07:45', type: 'optional', weight: 2 },
    { title: 'Point 1:1 manager', start: '10:00', end: '10:30', type: 'fixed', weight: 1 },
    { title: 'Payer les factures', description: 'Électricité, internet, assurance.', type: 'mandatory', weight: 2 },
    { title: 'Appeler maman', start: '20:00', end: '20:30', type: 'optional', weight: 1 },
  ],
  [
    { title: 'Clôturer les tickets du sprint', start: '09:30', end: '11:30', type: 'mandatory', weight: 3 },
    { title: 'Démo sprint', start: '15:00', end: '16:00', type: 'fixed', weight: 2 },
    { title: 'Apéro équipe', start: '18:30', end: '20:00', type: 'optional', weight: 1 },
    { title: 'Renouveler le passeport', description: 'Le dossier expire lundi.', type: 'urgent', weight: 2 },
  ],
  [
    { title: 'Marché du samedi', start: '10:00', end: '11:00', type: 'optional', weight: 1 },
    { title: 'Ménage de l’appartement', start: '14:00', end: '15:30', type: 'mandatory', weight: 3 },
  ],
  [
    { title: 'Balade en forêt', start: '10:00', end: '12:00', type: 'optional', weight: 2 },
    { title: 'Préparer les repas de la semaine', start: '17:00', end: '18:30', type: 'mandatory', weight: 2 },
  ],
];

const WEEKS_BEFORE = 5;
const WEEKS_AFTER = 5;

/** Génère un jeu de données fictif cohérent par rapport à la date du jour. */
export function buildSeed(now = new Date()): { tasks: Task[]; rewards: WeeklyReward[] } {
  const todayIso = toISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const monday = startOfISOWeek(now);
  const createdAt = now.toISOString();
  const tasks: Task[] = [];
  let n = 0;

  for (let w = -WEEKS_BEFORE; w <= WEEKS_AFTER; w++) {
    WEEK_TEMPLATE.forEach((dayTemplates, dayIndex) => {
      const iso = toISODate(addDays(monday, w * 7 + dayIndex));
      dayTemplates.forEach((tpl) => {
        n++;
        // Un peu de variété hors semaine courante
        if (w !== 0 && (n * 7 + w) % 5 === 0) return;

        let isDone = false;
        if (iso < todayIso) isDone = n % 6 !== 0;
        else if (iso === todayIso) isDone = !!tpl.end && timeToMinutes(tpl.end) <= nowMinutes;

        tasks.push({
          id: `seed-${n}`,
          title: tpl.title,
          description: tpl.description ?? null,
          date: iso,
          start_time: tpl.start ?? null,
          end_time: tpl.end ?? null,
          task_type: tpl.type,
          weight: tpl.weight,
          is_done: isDone,
          completed_at: isDone ? new Date(`${iso}T${tpl.end ?? '18:00'}:00`).toISOString() : null,
          created_at: createdAt,
          updated_at: createdAt,
        });
      });
    });
  }

  const rewardFor = (weekOffset: number, title: string, claimed: boolean): WeeklyReward => {
    const { year, week } = isoWeekOf(addDays(monday, weekOffset * 7));
    // Une récompense ne peut être réclamée que si l'objectif de la semaine est atteint.
    const stats = summarize(tasksOfWeek(tasks, year, week));
    const unlocked = isUnlocked(stats.points_done, targetPoints(stats.points_planned));
    return { id: `reward-${year}-${week}`, year, week_number: week, reward_title: title, is_claimed: claimed && unlocked };
  };

  const rewards = [
    rewardFor(-4, 'Une glace artisanale 🍦', true),
    rewardFor(-3, 'Soirée jeux vidéo 🎮', false),
    rewardFor(-2, 'Soirée cinéma 🎬', true),
    rewardFor(-1, 'Brunch du dimanche 🥞', true),
    rewardFor(0, 'Un resto ce weekend 🍝', false),
    rewardFor(1, 'Séance de massage 💆', false),
  ];

  return { tasks, rewards };
}
