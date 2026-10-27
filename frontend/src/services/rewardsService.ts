import type { WeeklyReward, WeeklyRewardInput, WeeklyRewardSummary } from '../types';
import { isUnlocked, summarize, targetPoints, tasksOfWeek } from '../utils/tasks';
import { loadDb, networkDelay, newId, saveDb } from './mockDb';

/** Implémentation fictive de `/api/v1/rewards`. */
export const rewardsService = {
  /** GET /api/v1/rewards/weekly?year={year}&week={week} — objectif = 80 % des points planifiés. */
  async getWeekly(year: number, week: number): Promise<WeeklyRewardSummary> {
    await networkDelay();
    const db = loadDb();
    const stats = summarize(tasksOfWeek(db.tasks, year, week));
    const target = targetPoints(stats.points_planned);
    const reward = db.rewards.find((r) => r.year === year && r.week_number === week) ?? null;
    return {
      year,
      week_number: week,
      reward: reward ? { ...reward } : null,
      planned_points: stats.points_planned,
      target_points: target,
      current_points: stats.points_done,
      is_unlocked: isUnlocked(stats.points_done, target),
      tasks_done: stats.tasks_done,
      tasks_total: stats.tasks_total,
    };
  },

  /** POST /api/v1/rewards/weekly — titre et statut réclamé ; le quota est calculé côté serveur. */
  async upsertWeekly(input: WeeklyRewardInput): Promise<WeeklyReward> {
    await networkDelay();
    const db = loadDb();
    const existing = db.rewards.find((r) => r.year === input.year && r.week_number === input.week_number);
    const reward: WeeklyReward = {
      id: existing?.id ?? newId(),
      ...input,
      is_claimed: input.is_claimed ?? existing?.is_claimed ?? false,
    };
    saveDb({
      ...db,
      rewards: existing ? db.rewards.map((r) => (r.id === existing.id ? reward : r)) : [...db.rewards, reward],
    });
    return { ...reward };
  },
};
