import type { DailyStats, WeeklyStats } from '../types';
import { request } from './api';

export const statsService = {
  /** GET /api/v1/stats/daily?start_date={date}&end_date={date} */
  daily: (startDate: string, endDate: string) =>
    request<DailyStats[]>('GET', '/stats/daily', { query: { start_date: startDate, end_date: endDate } }),

  /** GET /api/v1/stats/weekly?start_year&start_week&end_year&end_week */
  weekly: (startYear: number, startWeek: number, endYear: number, endWeek: number) =>
    request<WeeklyStats[]>('GET', '/stats/weekly', {
      query: { start_year: startYear, start_week: startWeek, end_year: endYear, end_week: endWeek },
    }),
};
