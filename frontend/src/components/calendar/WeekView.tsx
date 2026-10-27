import { isSameDay } from 'date-fns';
import type { Task } from '../../types';
import { formatShortWeekday, toISODate, weekDays } from '../../utils/date';
import { summarize } from '../../utils/tasks';
import { CompletionGauge } from '../CompletionGauge';
import { TaskItem } from '../TaskItem';
import type { TaskDraft } from '../TaskModal';

interface WeekViewProps {
  date: Date;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onCreate: (draft: TaskDraft) => void;
  onSelectDay: (date: Date) => void;
}

export function WeekView({ date, tasks, onEdit, onCreate, onSelectDay }: WeekViewProps) {
  const today = new Date();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {weekDays(date).map((day) => {
        const iso = toISODate(day);
        const dayTasks = tasks.filter((t) => t.date === iso);
        const isToday = isSameDay(day, today);
        const stats = summarize(dayTasks);
        return (
          <section
            key={iso}
            className={`flex min-h-[220px] flex-col rounded-2xl border p-2 ${
              isToday ? 'border-ink/25 bg-white shadow-sm' : 'border-line bg-white/60'
            }`}
          >
            <header className="mb-2 flex items-center justify-between gap-1 px-1">
              <button type="button" onClick={() => onSelectDay(day)} className="group flex items-center gap-1.5" title="Voir la journée">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">{formatShortWeekday(day)}</span>
                <span
                  className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-sm font-semibold tabular-nums transition ${
                    isToday ? 'bg-ink text-paper' : 'group-hover:bg-paper'
                  }`}
                >
                  {day.getDate()}
                </span>
              </button>
              {stats.tasks_total > 0 && (
                <span
                  className="whitespace-nowrap text-[11px] font-medium tabular-nums text-ink/50"
                  title={`${stats.tasks_done} tâche(s) terminée(s) sur ${stats.tasks_total} · ${stats.points_done}/${stats.points_planned} pts`}
                >
                  ✓ {stats.tasks_done}/{stats.tasks_total}
                </span>
              )}
            </header>
            {stats.tasks_total > 0 && (
              <CompletionGauge value={stats.completion_rate} className="-mt-1 mb-2 h-1" label={`Complétion du ${iso}`} />
            )}

            <div className="flex flex-1 flex-col gap-1.5">
              {dayTasks.map((t) => (
                <TaskItem key={t.id} task={t} onEdit={onEdit} compact />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onCreate({ date: iso })}
              className="mt-2 rounded-xl py-1.5 text-xs font-medium text-ink/40 transition hover:bg-paper hover:text-ink"
            >
              + Ajouter
            </button>
          </section>
        );
      })}
    </div>
  );
}
