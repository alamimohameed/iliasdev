import { addDays, addWeeks } from 'date-fns';
import type { DailyStats, WeeklyStats } from '../types';
import { fromISODate, isoWeekOf, mondayOfISOWeek, toISODate } from '../utils/date';
import { isUnlocked, summarize, targetPoints, tasksOfWeek } from '../utils/tasks';
import { loadDb, networkDelay } from './mockDb';

/** Implémentation fictive de `/api/v1/stats` (suivi des tâches terminées). */
export const statsService = {
  /** GET /api/v1/stats/daily?start_date={date}&end_date={date} */
  async daily(startDate: string, endDate: string): Promise<DailyStats[]> {
    await networkDelay();
    const { tasks } = loadDb();
    const result: DailyStats[] = [];
    for (let d = fromISODate(startDate); toISODate(d) <= endDate; d = addDays(d, 1)) {
      const iso = toISODate(d);
      result.push({ date: iso, ...summarize(tasks.filter((t) => t.date === iso)) });
    }
    return result;
  },

  /** GET /api/v1/stats/weekly?start_year&start_week&end_year&end_week */
  async weekly(startYear: number, startWeek: number, endYear: number, endWeek: number): Promise<WeeklyStats[]> {
    await networkDelay();
    const db = loadDb();
    const last = mondayOfISOWeek(endYear, endWeek);
    const result: WeeklyStats[] = [];
    for (let monday = mondayOfISOWeek(startYear, startWeek); monday <= last; monday = addWeeks(monday, 1)) {
      const { year, week } = isoWeekOf(monday);
      const stats = summarize(tasksOfWeek(db.tasks, year, week));
      const target = targetPoints(stats.points_planned);
      const reward = db.rewards.find((r) => r.year === year && r.week_number === week);
      result.push({
        year,
        week_number: week,
        ...stats,
        target_points: target,
        // Arrondi à l'inférieur : on n'affiche jamais 80 % tant que le seuil n'est pas réellement atteint.
        points_rate: stats.points_planned ? Math.floor((stats.points_done * 100) / stats.points_planned) : 0,
        reward_unlocked: isUnlocked(stats.points_done, target),
        reward_claimed: !!reward?.is_claimed,
      });
    }
    return result;
  },
};
