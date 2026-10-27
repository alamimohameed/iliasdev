import type { WeeklyReward, WeeklyRewardInput, WeeklyRewardSummary } from '../types';
import { request } from './api';

export const rewardsService = {
  /** GET /api/v1/rewards/weekly?year={year}&week={week} — objectif = 80 % des points planifiés. */
  getWeekly: (year: number, week: number) =>
    request<WeeklyRewardSummary>('GET', '/rewards/weekly', { query: { year, week } }),

  /** POST /api/v1/rewards/weekly — titre et statut réclamé ; le quota est calculé côté serveur. */
  upsertWeekly: (input: WeeklyRewardInput) => request<WeeklyReward>('POST', '/rewards/weekly', { body: input }),
};
