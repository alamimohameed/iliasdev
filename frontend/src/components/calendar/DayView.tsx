import { isSameDay } from 'date-fns';
import { useEffect, useRef } from 'react';
import { useNow } from '../../hooks/useNow';
import { useToggleTask } from '../../hooks/useTasks';
import type { Task } from '../../types';
import { formatTimeRange, minutesToTime, timeToMinutes, toISODate } from '../../utils/date';
import { rate, summarize, TASK_TYPE_META, TASK_TYPES } from '../../utils/tasks';
import { Checkbox } from '../Checkbox';
import { CompletionGauge } from '../CompletionGauge';
import { TaskItem, UrgentBadge } from '../TaskItem';
import type { TaskDraft } from '../TaskModal';

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 64;
const DEFAULT_DURATION = 60;

interface Placed {
  task: Task;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

/** Répartit les tâches qui se chevauchent sur des colonnes côte à côte. */
function layoutTimed(tasks: Task[]): Placed[] {
  const items: Placed[] = tasks
    .map((task) => {
      const start = timeToMinutes(task.start_time!);
      const end = task.end_time ? Math.max(timeToMinutes(task.end_time), start + 15) : start + DEFAULT_DURATION;
      return { task, start, end, lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => cluster.forEach((p) => (p.lanes = laneEnds.length));

  for (const item of items) {
    if (item.start >= clusterEnd) {
      flush();
      cluster = [];
      laneEnds = [];
    }
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = item.end;
    item.lane = lane;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return items;
}

const minutesToTop = (min: number) => ((Math.max(min, START_HOUR * 60) - START_HOUR * 60) / 60) * HOUR_HEIGHT;

interface DayViewProps {
  date: Date;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onCreate: (draft: TaskDraft) => void;
}

export function DayView({ date, tasks, onEdit, onCreate }: DayViewProps) {
  const toggle = useToggleTask();
  const now = useNow();
  const scrollRef = useRef<HTMLDivElement>(null);
  const iso = toISODate(date);
  const dayTasks = tasks.filter((t) => t.date === iso);
  const timed = layoutTimed(dayTasks.filter((t) => t.start_time));
  const untimed = dayTasks.filter((t) => !t.start_time);
  const stats = summarize(dayTasks);
  const isToday = isSameDay(date, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Repositionne la timeline uniquement au changement de jour.
  useEffect(() => {
    const starts = timed.map((p) => p.start);
    const target = isToday ? nowMinutes - 90 : starts.length ? Math.min(...starts) - 30 : 8 * 60;
    scrollRef.current?.scrollTo({ top: minutesToTop(target) });
  }, [iso]); // eslint-disable-line react-hooks/exhaustive-deps

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div ref={scrollRef} className="relative max-h-[640px] overflow-y-auto rounded-2xl border border-line bg-white">
        <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
          {hours.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() =>
                onCreate({ date: iso, start_time: minutesToTime(h * 60), end_time: h === 23 ? '23:59' : minutesToTime((h + 1) * 60) })
              }
              className="group absolute inset-x-0 flex border-t border-line/70 text-left first:border-t-0 hover:bg-paper/60"
              style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              aria-label={`Ajouter une tâche à ${h}h`}
            >
              <span className="w-14 shrink-0 -translate-y-2 pr-2 text-right text-[11px] tabular-nums text-ink/40">
                {h > START_HOUR ? `${String(h).padStart(2, '0')}:00` : ''}
              </span>
              <span className="mt-2 hidden text-xs text-ink/35 group-hover:inline">+ Ajouter</span>
            </button>
          ))}

          <div className="pointer-events-none absolute inset-y-0 left-14 right-2">
            {timed.map(({ task, start, end, lane, lanes }) => {
              const meta = TASK_TYPE_META[task.task_type];
              const top = minutesToTop(start);
              const height = Math.max(minutesToTop(end) - top, 28) - 3;
              const short = height < 48;
              return (
                <div
                  key={task.id}
                  className={`pointer-events-auto absolute flex cursor-pointer gap-2 overflow-hidden rounded-xl border-l-4 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md ${
                    meta.borderStrong
                  } ${task.is_done ? 'bg-paper' : meta.soft}`}
                  style={{
                    top: top + 1,
                    height,
                    left: `calc(${(lane / lanes) * 100}% + 2px)`,
                    width: `calc(${100 / lanes}% - 4px)`,
                  }}
                  onClick={() => onEdit(task)}
                >
                  <Checkbox
                    checked={task.is_done}
                    onToggle={() => toggle.mutate(task.id)}
                    type={task.task_type}
                    size="sm"
                    label={`Marquer « ${task.title} » comme ${task.is_done ? 'à faire' : 'terminée'}`}
                  />
                  <div className={`min-w-0 ${short ? 'flex items-baseline gap-2' : ''}`}>
                    <p className={`truncate text-[13px] font-semibold leading-tight ${task.is_done ? 'text-ink/40 line-through' : ''}`}>
                      {task.title}
                    </p>
                    <p className={`flex items-center gap-1.5 truncate text-[11px] tabular-nums ${task.is_done ? 'text-ink/35' : meta.text}`}>
                      {task.task_type === 'urgent' && !task.is_done && <UrgentBadge />}
                      {formatTimeRange(task.start_time, task.end_time)} · {task.weight} pt{task.weight > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {isToday && nowMinutes >= START_HOUR * 60 && (
            <div className="pointer-events-none absolute left-12 right-0 z-10 flex items-center" style={{ top: minutesToTop(nowMinutes) }}>
              <span className="h-2.5 w-2.5 -translate-x-1 rounded-full bg-mandatory" />
              <span className="h-px flex-1 bg-mandatory" />
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="field-label mb-0">Bilan du jour</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="font-display text-2xl tabular-nums">
              {stats.tasks_done}
              <span className="text-base text-ink/40"> / {stats.tasks_total} tâches</span>
            </p>
            <p className="text-sm font-semibold tabular-nums text-emerald-700">{stats.completion_rate}%</p>
          </div>
          <CompletionGauge value={stats.completion_rate} className="mt-2 h-2" />
          <p className="mt-2 text-xs text-ink/50">
            {stats.points_done} / {stats.points_planned} pts validés
          </p>
          <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
            {TASK_TYPES.map((type) => {
              const { total, done } = stats.by_type[type];
              return (
                <li key={type} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${TASK_TYPE_META[type].dot}`} />
                  <span className="w-20 shrink-0">{TASK_TYPE_META[type].label}</span>
                  <CompletionGauge value={rate(done, total)} color={TASK_TYPE_META[type].dot} className="h-1" />
                  <span className="w-8 shrink-0 text-right tabular-nums text-ink/50">
                    {done}/{total}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="field-label mb-0">Sans horaire</p>
            <button type="button" onClick={() => onCreate({ date: iso })} className="text-xs font-semibold text-ink/60 hover:text-ink">
              + Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {untimed.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line px-3 py-4 text-center text-xs text-ink/40">
                Aucune tâche sans créneau.
              </p>
            )}
            {untimed.map((t) => (
              <TaskItem key={t.id} task={t} onEdit={onEdit} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
