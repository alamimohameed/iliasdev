import { useNow } from '../hooks/useNow';
import { formatLongDate } from '../utils/date';

export function Header({ onAddTask }: { onAddTask: () => void }) {
  const now = useNow();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ink font-display text-lg text-paper">T</div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">Tempo · Aujourd’hui</p>
            <h1 className="truncate font-display text-lg sm:text-2xl">{formatLongDate(now)}</h1>
          </div>
        </div>
        <button type="button" onClick={onAddTask} className="btn-primary shrink-0">
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Ajouter une tâche</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>
    </header>
  );
}
