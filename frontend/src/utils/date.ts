import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  setISOWeek,
  startOfISOWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CalendarViewMode } from '../types';

const WEEK_OPTS = { weekStartsOn: 1 as const };

export const toISODate = (d: Date) => format(d, 'yyyy-MM-dd');
export const fromISODate = (s: string) => parseISO(s);

const capitalizeWords = (s: string) =>
  s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** « Mardi 27 Octobre 2026 » */
export const formatLongDate = (d: Date) => capitalizeWords(format(d, 'EEEE d MMMM yyyy', { locale: fr }));
export const formatMonthYear = (d: Date) => capitalizeWords(format(d, 'MMMM yyyy', { locale: fr }));
/** « Lun. » */
export const formatShortWeekday = (d: Date) => capitalizeWords(format(d, 'EEE', { locale: fr }));
/** « 27 oct. » */
export const formatDayMonth = (d: Date) => format(d, 'd MMM', { locale: fr });

export const weekDays = (d: Date) =>
  eachDayOfInterval({ start: startOfWeek(d, WEEK_OPTS), end: endOfWeek(d, WEEK_OPTS) });

/** Jours affichés dans la grille mensuelle (semaines complètes, lundi → dimanche). */
export const monthGrid = (d: Date) =>
  eachDayOfInterval({
    start: startOfWeek(startOfMonth(d), WEEK_OPTS),
    end: endOfWeek(endOfMonth(d), WEEK_OPTS),
  });

/** Intervalle de dates à charger pour une vue donnée (paramètres start_date / end_date de l'API). */
export function getRange(view: CalendarViewMode, d: Date): { start: string; end: string } {
  switch (view) {
    case 'day':
      return { start: toISODate(d), end: toISODate(d) };
    case 'week':
    case 'tracking': {
      const days = weekDays(d);
      return { start: toISODate(days[0]), end: toISODate(days[days.length - 1]) };
    }
    case 'month': {
      const days = monthGrid(d);
      return { start: toISODate(days[0]), end: toISODate(days[days.length - 1]) };
    }
  }
}

export function shiftDate(view: CalendarViewMode, d: Date, dir: 1 | -1): Date {
  switch (view) {
    case 'day':
      return addDays(d, dir);
    case 'week':
    case 'tracking':
      return addWeeks(d, dir);
    case 'month':
      return addMonths(d, dir);
  }
}

export const isoWeekOf = (d: Date) => ({ year: getISOWeekYear(d), week: getISOWeek(d) });

/** Lundi de la semaine ISO donnée (le 4 janvier est toujours en semaine 1). */
export const mondayOfISOWeek = (year: number, week: number) => startOfISOWeek(setISOWeek(new Date(year, 0, 4), week));

export const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const formatTimeRange = (start: string | null, end: string | null) =>
  !start ? null : end ? `${start} – ${end}` : start;
