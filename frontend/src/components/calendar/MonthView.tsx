import { isSameDay, isSameMonth } from 'date-fns';
import { useToggleTask } from '../../hooks/useTasks';
import type { Task } from '../../types';
import { monthGrid, toISODate } from '../../utils/date';
import { summarize, TASK_TYPE_META } from '../../utils/tasks';
import { CompletionGauge } from '../CompletionGauge';
import type { TaskDraft } from '../TaskModal';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MAX_BADGES = 3;

interface MonthViewProps {
  date: Date;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onCreate: (draft: TaskDraft) => void;
  onSelectDay: (date: Date) => void;
}

function TaskBadge({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const toggle = useToggleTask();
  const meta = TASK_TYPE_META[task.task_type];
  return (
    <div className={`flex items-center gap-1 rounded-md border-l-2 py-0.5 pl-1 pr-1.5 ${meta.borderStrong} ${meta.soft}`}>
      <button
        type="button"
        onClick={() => toggle.mutate(task.id)}
        aria-label={`${task.title} : ${task.is_done ? 'terminée' : 'à faire'} — basculer`}
        title={task.is_done ? 'Terminée — cliquer pour rouvrir' : 'À faire — cliquer pour valider'}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full hover:ring-2 hover:ring-ink/10"
      >
        <span className="text-[10px] leading-none">{task.is_done ? '✅' : '⏳'}</span>
      </button>
      <button
        type="button"
        onClick={() => onEdit(task)}
        className={`min-w-0 flex-1 truncate text-left text-[11px] font-medium ${task.is_done ? 'text-ink/40 line-through' : meta.text}`}
      >
        {task.start_time && <span className="mr-1 tabular-nums opacity-70">{task.start_time}</span>}
        {task.title}
      </button>
    </div>
  );
}

export function MonthView({ date, tasks, onEdit, onCreate, onSelectDay }: MonthViewProps) {
  const today = new Date();
  const days = monthGrid(date);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 text-[11px] font-semibold uppercase tracking-wider text-ink/45">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = toISODate(day);
          const dayTasks = tasks.filter((t) => t.date === iso);
          const inMonth = isSameMonth(day, date);
          const isToday = isSameDay(day, today);
          const hidden = dayTasks.length - MAX_BADGES;
          const stats = summarize(dayTasks);
          return (
            <div
              key={iso}
              className={`group flex min-h-[72px] flex-col rounded-xl border p-1 sm:min-h-[118px] sm:p-1.5 ${
                inMonth ? 'border-line bg-white' : 'border-transparent bg-white/40'
              } ${isToday ? 'ring-2 ring-ink/80' : ''}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-semibold tabular-nums transition hover:bg-paper ${
                    isToday ? 'bg-ink text-paper hover:bg-ink' : inMonth ? '' : 'text-ink/30'
                  }`}
                  title="Voir la journée"
                >
                  {day.getDate()}
                </button>
                <div className="flex items-center gap-1">
                  {stats.tasks_total > 0 && (
                    <span className="hidden text-[10px] font-medium tabular-nums text-ink/45 sm:inline">
                      {stats.tasks_done}/{stats.tasks_total}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onCreate({ date: iso })}
                    aria-label={`Ajouter une tâche le ${iso}`}
                    className="hidden h-5 w-5 place-items-center rounded-full text-sm text-ink/40 hover:bg-paper hover:text-ink group-hover:grid"
                  >
                    +
                  </button>
                </div>
              </div>
              {stats.tasks_total > 0 && (
                <CompletionGauge value={stats.completion_rate} className="mb-1 h-1" label={`Complétion du ${iso}`} />
              )}

              {/* Mobile : simples pastilles colorées */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {dayTasks.map((t) => (
                  <span
                    key={t.id}
                    className={`h-1.5 w-1.5 rounded-full ${TASK_TYPE_META[t.task_type].dot} ${t.is_done ? 'opacity-30' : ''}`}
                  />
                ))}
              </div>

              <div className="hidden flex-col gap-0.5 sm:flex">
                {dayTasks.slice(0, MAX_BADGES).map((t) => (
                  <TaskBadge key={t.id} task={t} onEdit={onEdit} />
                ))}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="px-1 text-left text-[11px] font-medium text-ink/45 hover:text-ink"
                  >
                    +{hidden} autre{hidden > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink/55">
        <span>✅ Terminée</span>
        <span>⏳ À faire</span>
        <span className="text-ink/35">Cliquez sur l’icône pour changer le statut, sur le titre pour modifier.</span>
      </div>
    </div>
  );
}
