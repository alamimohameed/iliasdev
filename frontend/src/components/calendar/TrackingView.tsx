import { isSameDay, subWeeks } from 'date-fns';
import type { ReactNode } from 'react';
import { useDailyStats, useWeeklyStats } from '../../hooks/useStats';
import type { WeeklyStats } from '../../types';
import { formatDayMonth, formatShortWeekday, fromISODate, isoWeekOf, mondayOfISOWeek, toISODate, weekDays } from '../../utils/date';
import { rate, REWARD_TARGET_PERCENT, TASK_TYPE_META, TASK_TYPES } from '../../utils/tasks';
import { CompletionGauge } from '../CompletionGauge';

const HISTORY_WEEKS = 8;
const CHART_HEIGHT = 160;

interface TrackingViewProps {
  date: Date;
  onSelectDay: (date: Date) => void;
  onSelectWeek: (date: Date) => void;
}

function Kpi({ label, value, sub, aside }: { label: string; value: string; sub?: string; aside?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="field-label mb-1">{label}</p>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="font-display text-2xl tabular-nums">{value}</p>
        {aside}
      </div>
      {sub && <p className="mt-0.5 text-xs text-ink/50">{sub}</p>}
    </div>
  );
}

/** Progression des points en %, comparée au seuil de récompense (ex : « 23 % / 80 % »). */
function PointsRate({ value, reached }: { value: number; reached: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        reached ? 'bg-emerald-100 text-emerald-800' : 'bg-ink/[0.06] text-ink/65'
      }`}
      title={`${value} % des points planifiés accumulés — seuil de récompense : ${REWARD_TARGET_PERCENT} %`}
    >
      {value} % / {REWARD_TARGET_PERCENT} %
    </span>
  );
}

function rewardStatus(w: WeeklyStats, isCurrent: boolean) {
  if (w.reward_claimed) return { icon: '🏆', label: 'Réclamée', className: 'text-emerald-700' };
  if (w.reward_unlocked) return { icon: '🎁', label: 'Débloquée', className: 'text-amber-700' };
  if (isCurrent) return { icon: '⏳', label: 'En cours', className: 'text-ink/50' };
  return { icon: '—', label: 'Non atteinte', className: 'text-ink/35' };
}

export function TrackingView({ date, onSelectDay, onSelectWeek }: TrackingViewProps) {
  const days = weekDays(date);
  const { data: daily = [] } = useDailyStats(toISODate(days[0]), toISODate(days[6]));
  const selected = isoWeekOf(date);
  const first = isoWeekOf(subWeeks(date, HISTORY_WEEKS - 1));
  const { data: weekly = [], isLoading } = useWeeklyStats(first.year, first.week, selected.year, selected.week);

  const week = weekly[weekly.length - 1];
  const today = new Date();
  const current = isoWeekOf(today);
  const maxTotal = Math.max(1, ...daily.map((d) => d.tasks_total));

  if (isLoading || !week) {
    return <div className="h-96 animate-pulse rounded-2xl bg-paper" />;
  }

  const urgent = week.by_type.urgent;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Tâches terminées" value={`${week.tasks_done} / ${week.tasks_total}`} sub="sur la semaine" />
        <Kpi label="Taux de complétion" value={`${week.completion_rate}%`} sub={`${week.tasks_total - week.tasks_done} tâche(s) restante(s)`} />
        <Kpi
          label="Points accumulés"
          value={`${week.points_done} / ${week.points_planned}`}
          aside={<PointsRate value={week.points_rate} reached={week.reward_unlocked} />}
          sub="points accumulés / points planifiés"
        />
        <Kpi
          label="Urgentes terminées"
          value={`${urgent.done} / ${urgent.total}`}
          sub={urgent.total ? `${rate(urgent.done, urgent.total)} %` : 'aucune cette semaine'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg">Tâches terminées par jour</h3>
            <div className="flex items-center gap-3 text-[11px] text-ink/55">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Terminées
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-ink/10" /> Prévues
              </span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daily.map((d) => {
              const day = fromISODate(d.date);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className="flex flex-col items-center gap-1.5 rounded-xl pt-1 transition hover:bg-paper"
                  title={`${d.tasks_done}/${d.tasks_total} tâches · ${d.points_done}/${d.points_planned} pts — voir la journée`}
                >
                  <span className="text-[11px] font-semibold tabular-nums text-ink/60">
                    {d.tasks_done}/{d.tasks_total}
                  </span>
                  <div className="relative w-full max-w-[36px]" style={{ height: CHART_HEIGHT }}>
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-ink/10"
                      style={{ height: `${(d.tasks_total / maxTotal) * 100}%` }}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-emerald-500 transition-[height] duration-500"
                      style={{ height: `${(d.tasks_done / maxTotal) * 100}%` }}
                    />
                  </div>
                  <span className={`rounded-full px-1.5 text-[11px] font-medium ${isToday ? 'bg-ink text-paper' : 'text-ink/55'}`}>
                    {formatShortWeekday(day)} {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4">
          <h3 className="mb-4 font-display text-lg">Répartition par type</h3>
          <ul className="space-y-3.5">
            {TASK_TYPES.map((type) => {
              const { total, done } = week.by_type[type];
              const meta = TASK_TYPE_META[type];
              return (
                <li key={type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-ink/55">
                      {done}/{total}
                    </span>
                  </div>
                  <CompletionGauge value={rate(done, total)} color={meta.dot} className="h-2" label={`Complétion ${meta.label}`} />
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h3 className="mb-3 font-display text-lg">Historique · {HISTORY_WEEKS} dernières semaines</h3>
        <div className="divide-y divide-line">
          {[...weekly].reverse().map((w) => {
            const monday = mondayOfISOWeek(w.year, w.week_number);
            const isCurrent = w.year === current.year && w.week_number === current.week;
            const isSelected = w.year === selected.year && w.week_number === selected.week;
            const status = rewardStatus(w, isCurrent);
            return (
              <button
                key={`${w.year}-${w.week_number}`}
                type="button"
                onClick={() => onSelectWeek(monday)}
                className={`grid w-full grid-cols-[72px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-paper sm:grid-cols-[110px_1fr_200px_110px] ${
                  isSelected ? 'bg-paper' : ''
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">S{w.week_number}</span>
                  <span className="block text-[11px] text-ink/45">{formatDayMonth(monday)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CompletionGauge value={w.completion_rate} className="h-2" />
                  <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{w.completion_rate}%</span>
                </span>
                <span className="hidden items-center gap-2 text-xs tabular-nums text-ink/55 sm:flex">
                  <span className="w-[68px]">
                    {w.points_done}/{w.points_planned} pts
                  </span>
                  <PointsRate value={w.points_rate} reached={w.reward_unlocked} />
                </span>
                <span className={`text-xs font-medium ${status.className}`}>
                  {status.icon} <span className="hidden sm:inline">{status.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
