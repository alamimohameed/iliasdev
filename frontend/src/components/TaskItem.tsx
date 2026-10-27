import { useDeleteTask, useToggleTask } from '../hooks/useTasks';
import type { Task } from '../types';
import { formatTimeRange } from '../utils/date';
import { TASK_TYPE_META } from '../utils/tasks';
import { Checkbox } from './Checkbox';

export function UrgentBadge() {
  return (
    <span className="rounded-full bg-urgent px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white">Urgent</span>
  );
}

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  compact?: boolean;
}

export function TaskItem({ task, onEdit, compact = false }: TaskItemProps) {
  const toggle = useToggleTask();
  const remove = useDeleteTask();
  const meta = TASK_TYPE_META[task.task_type];
  // En mode compact (colonnes étroites), seule l'heure de début est affichée.
  const time = compact ? task.start_time : formatTimeRange(task.start_time, task.end_time);

  const handleDelete = () => {
    if (window.confirm(`Supprimer « ${task.title} » ?`)) remove.mutate(task.id);
  };

  return (
    <div
      className={`group relative flex items-start gap-2.5 rounded-2xl border border-l-4 ${meta.border} ${meta.borderStrong} ${
        task.is_done ? 'bg-paper/70' : meta.soft
      } ${compact ? 'gap-2 px-2 py-2' : 'px-3 py-2.5'} transition`}
    >
      <div className={compact ? 'pt-px' : 'pt-0.5'}>
        <Checkbox
          checked={task.is_done}
          onToggle={() => toggle.mutate(task.id)}
          type={task.task_type}
          size={compact ? 'sm' : 'md'}
          label={`Marquer « ${task.title} » comme ${task.is_done ? 'à faire' : 'terminée'}`}
        />
      </div>

      <button type="button" onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left">
        <p
          className={`font-medium leading-snug ${compact ? 'text-[13px]' : 'text-sm'} ${
            task.is_done ? 'text-ink/40 line-through decoration-ink/30' : 'text-ink'
          } ${compact ? 'line-clamp-3 break-words hyphens-auto' : 'truncate'}`}
        >
          {task.title}
        </p>
        <p className={`mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] ${task.is_done ? 'text-ink/35' : meta.text}`}>
          {task.task_type === 'urgent' && !task.is_done && <UrgentBadge />}
          {time && <span className="tabular-nums">{time}</span>}
          {time && <span aria-hidden>·</span>}
          <span>
            {task.weight} pt{task.weight > 1 ? 's' : ''}
          </span>
          {!compact && task.task_type !== 'urgent' && (
            <>
              <span aria-hidden>·</span>
              <span>{meta.label}</span>
            </>
          )}
        </p>
        {!compact && task.description && <p className="mt-1 line-clamp-2 text-xs text-ink/55">{task.description}</p>}
      </button>

      {!compact && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Supprimer « ${task.title} »`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink/35 opacity-100 transition hover:bg-white hover:text-mandatory sm:opacity-0 sm:group-hover:opacity-100"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
