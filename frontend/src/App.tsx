import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CalendarView } from './components/calendar/CalendarView';
import { Header } from './components/Header';
import { RewardModal } from './components/RewardModal';
import { RewardWidget } from './components/RewardWidget';
import { TaskItem } from './components/TaskItem';
import { TaskModal, type TaskDraft } from './components/TaskModal';
import { useWeeklyReward } from './hooks/useRewards';
import { useTasks } from './hooks/useTasks';
import { resetDb } from './services/mockDb';
import type { CalendarViewMode, Task } from './types';
import { getRange, isoWeekOf, toISODate } from './utils/date';
import { TASK_TYPE_META, TASK_TYPES } from './utils/tasks';

type TaskModalState = { task?: Task; draft?: TaskDraft } | null;

export default function App() {
  const qc = useQueryClient();
  const [view, setView] = useState<CalendarViewMode>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [taskModal, setTaskModal] = useState<TaskModalState>(null);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);

  const range = getRange(view, cursor);
  const { data: tasks = [], isFetching } = useTasks(range.start, range.end);

  const todayIso = toISODate(new Date());
  const { data: todayTasks = [] } = useTasks(todayIso, todayIso);

  const { year, week } = isoWeekOf(cursor);
  const current = isoWeekOf(new Date());
  const { data: rewardSummary } = useWeeklyReward(year, week);

  const openCreate = (draft?: TaskDraft) => setTaskModal({ draft: draft ?? { date: toISODate(view === 'day' ? cursor : new Date()) } });
  const openEdit = (task: Task) => setTaskModal({ task });

  const handleReset = () => {
    if (!window.confirm('Réinitialiser toutes les données de démonstration ?')) return;
    resetDb();
    qc.invalidateQueries();
  };

  return (
    <div className="min-h-screen">
      <Header onAddTask={() => openCreate()} />

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[1fr_300px]">
        <CalendarView
          view={view}
          onViewChange={setView}
          date={cursor}
          onDateChange={setCursor}
          tasks={tasks}
          isFetching={isFetching}
          onEdit={openEdit}
          onCreate={openCreate}
        />

        <aside className="space-y-5">
          <RewardWidget
            year={year}
            week={week}
            isCurrentWeek={year === current.year && week === current.week}
            onConfigure={() => setRewardModalOpen(true)}
          />

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">Aujourd’hui</h2>
              <span className="text-xs tabular-nums text-ink/45">
                {todayTasks.filter((t) => t.is_done).length}/{todayTasks.length} faites
              </span>
            </div>
            <div className="space-y-2">
              {todayTasks.length === 0 && <p className="text-sm text-ink/45">Rien de prévu aujourd’hui.</p>}
              {todayTasks.map((t) => (
                <TaskItem key={t.id} task={t} onEdit={openEdit} compact />
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="field-label">Types de tâches</h2>
            <ul className="space-y-2">
              {TASK_TYPES.map((type) => (
                <li key={type} className="flex items-center gap-2.5 text-sm">
                  <span className={`h-3 w-3 rounded-full ${TASK_TYPE_META[type].dot}`} />
                  <span className="font-medium">{TASK_TYPE_META[type].label}</span>
                  <span className="truncate text-xs text-ink/45">{TASK_TYPE_META[type].hint}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="px-1 text-xs text-ink/40">
            Mode démo : données fictives stockées dans votre navigateur.{' '}
            <button type="button" onClick={handleReset} className="underline underline-offset-2 hover:text-ink">
              Réinitialiser
            </button>
          </p>
        </aside>
      </main>

      {taskModal && <TaskModal task={taskModal.task} draft={taskModal.draft} onClose={() => setTaskModal(null)} />}
      {rewardModalOpen && (
        <RewardModal
          year={year}
          week={week}
          reward={rewardSummary?.reward ?? null}
          targetPoints={rewardSummary?.target_points ?? 0}
          plannedPoints={rewardSummary?.planned_points ?? 0}
          onClose={() => setRewardModalOpen(false)}
        />
      )}
    </div>
  );
}
