import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rewardsService } from '../services/rewardsService';
import type { WeeklyRewardInput } from '../types';

export const rewardKeys = {
  all: ['rewards'] as const,
  weekly: (year: number, week: number) => ['rewards', 'weekly', year, week] as const,
};

export function useWeeklyReward(year: number, week: number) {
  return useQuery({
    queryKey: rewardKeys.weekly(year, week),
    queryFn: () => rewardsService.getWeekly(year, week),
  });
}

export function useUpsertReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WeeklyRewardInput) => rewardsService.upsertWeekly(input),
    // Le statut « réclamée » apparaît aussi dans l'historique de suivi.
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: rewardKeys.all }), qc.invalidateQueries({ queryKey: ['stats'] })]),
  });
}
