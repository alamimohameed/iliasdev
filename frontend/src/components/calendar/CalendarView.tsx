import type { CalendarViewMode, Task } from '../../types';
import { formatDayMonth, formatLongDate, formatMonthYear, fromISODate, isoWeekOf, shiftDate, toISODate, weekDays } from '../../utils/date';
import type { TaskDraft } from '../TaskModal';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { TrackingView } from './TrackingView';
import { WeekView } from './WeekView';

const VIEW_LABELS: Record<CalendarViewMode, string> = { day: 'Jour', week: 'Semaine', month: 'Mois', tracking: 'Suivi' };

interface CalendarViewProps {
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  isFetching: boolean;
  onEdit: (task: Task) => void;
  onCreate: (draft: TaskDraft) => void;
}

function periodLabel(view: CalendarViewMode, date: Date) {
  if (view === 'day') return formatLongDate(date);
  if (view === 'month') return formatMonthYear(date);
  const days = weekDays(date);
  const prefix = view === 'tracking' ? 'Suivi · semaine' : 'Semaine';
  return `${prefix} ${isoWeekOf(date).week} · ${formatDayMonth(days[0])} – ${formatDayMonth(days[6])}`;
}

export function CalendarView({ view, onViewChange, date, onDateChange, tasks, isFetching, onEdit, onCreate }: CalendarViewProps) {
  const selectDay = (d: Date) => {
    onDateChange(d);
    onViewChange('day');
  };

  return (
    <section className="card p-3 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" className="btn-icon" onClick={() => onDateChange(shiftDate(view, date, -1))} aria-label="Période précédente">
            ‹
          </button>
          <button type="button" className="btn-icon" onClick={() => onDateChange(shiftDate(view, date, 1))} aria-label="Période suivante">
            ›
          </button>
          <button type="button" className="btn-ghost" onClick={() => onDateChange(new Date())}>
            Aujourd’hui
          </button>
          <h2 className="ml-1 truncate font-display text-lg sm:text-xl">{periodLabel(view, date)}</h2>
          {isFetching && <span className="h-2 w-2 animate-pulse rounded-full bg-ink/30" aria-label="Chargement" />}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Aller à la date"
            className="input w-auto py-2"
            value={toISODate(date)}
            onChange={(e) => e.target.value && onDateChange(fromISODate(e.target.value))}
          />
          <div className="flex rounded-full border border-line bg-paper p-1" role="tablist">
            {(Object.keys(VIEW_LABELS) as CalendarViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => onViewChange(v)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  view === v ? 'bg-ink text-paper shadow' : 'text-ink/60 hover:text-ink'
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'day' && <DayView date={date} tasks={tasks} onEdit={onEdit} onCreate={onCreate} />}
      {view === 'week' && <WeekView date={date} tasks={tasks} onEdit={onEdit} onCreate={onCreate} onSelectDay={selectDay} />}
      {view === 'month' && <MonthView date={date} tasks={tasks} onEdit={onEdit} onCreate={onCreate} onSelectDay={selectDay} />}
      {view === 'tracking' && <TrackingView date={date} onSelectDay={selectDay} onSelectWeek={onDateChange} />}
    </section>
  );
}
