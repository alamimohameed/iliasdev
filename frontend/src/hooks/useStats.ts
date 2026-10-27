import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { statsService } from '../services/statsService';

export const statsKeys = {
  all: ['stats'] as const,
  daily: (start: string, end: string) => ['stats', 'daily', start, end] as const,
  weekly: (startYear: number, startWeek: number, endYear: number, endWeek: number) =>
    ['stats', 'weekly', startYear, startWeek, endYear, endWeek] as const,
};

export function useDailyStats(start: string, end: string) {
  return useQuery({
    queryKey: statsKeys.daily(start, end),
    queryFn: () => statsService.daily(start, end),
    placeholderData: keepPreviousData,
  });
}

export function useWeeklyStats(startYear: number, startWeek: number, endYear: number, endWeek: number) {
  return useQuery({
    queryKey: statsKeys.weekly(startYear, startWeek, endYear, endWeek),
    queryFn: () => statsService.weekly(startYear, startWeek, endYear, endWeek),
    placeholderData: keepPreviousData,
  });
}
