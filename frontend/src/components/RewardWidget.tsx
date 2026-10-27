import { useEffect, useRef, useState } from 'react';
import { useUpsertReward, useWeeklyReward } from '../hooks/useRewards';
import { REWARD_TARGET_PERCENT } from '../utils/tasks';
import { Confetti } from './Confetti';

interface RewardWidgetProps {
  year: number;
  week: number;
  isCurrentWeek: boolean;
  onConfigure: () => void;
}

export function RewardWidget({ year, week, isCurrentWeek, onConfigure }: RewardWidgetProps) {
  const { data, isLoading } = useWeeklyReward(year, week);
  const upsert = useUpsertReward();
  const [burst, setBurst] = useState(0);
  const previous = useRef<{ key: string; reached: boolean } | null>(null);

  const reward = data?.reward ?? null;
  const points = data?.current_points ?? 0;
  const target = data?.target_points ?? 0;
  const planned = data?.planned_points ?? 0;
  const reached = !!data?.is_unlocked;
  // La barre représente 100 % des points planifiés ; le seuil de récompense est un repère à 80 %.
  // Arrondi à l'inférieur pour ne pas afficher 80 % avant que le seuil soit réellement atteint.
  const pct = planned > 0 ? Math.min(100, Math.floor((points * 100) / planned)) : 0;

  // Confettis uniquement quand l'objectif vient d'être franchi (pas au chargement).
  useEffect(() => {
    if (!data) return;
    const key = `${year}-${week}`;
    if (previous.current?.key === key && !previous.current.reached && reached) setBurst((b) => b + 1);
    previous.current = { key, reached };
  }, [data, reached, year, week]);

  const claim = () => {
    if (!reward) return;
    upsert.mutate(
      { year, week_number: week, reward_title: reward.reward_title, is_claimed: true },
      { onSuccess: () => setBurst((b) => b + 1) },
    );
  };

  return (
    <section
      className={`card relative overflow-hidden p-5 transition-colors ${
        reached ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-emerald-50' : ''
      }`}
    >
      {burst > 0 && <Confetti key={burst} />}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="field-label mb-0">Récompense hebdo</p>
          <h2 className="font-display text-2xl">
            Semaine {week}
            {isCurrentWeek && (
              <span className="ml-2 rounded-full bg-ink px-2 py-0.5 align-middle font-sans text-[10px] font-semibold uppercase tracking-wider text-paper">
                En cours
              </span>
            )}
          </h2>
        </div>
        <button type="button" onClick={onConfigure} className="btn-icon h-8 w-8 text-sm" aria-label="Configurer la récompense" title="Configurer">
          ✎
        </button>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-paper" />
          <div className="h-3 w-full animate-pulse rounded-full bg-paper" />
        </div>
      ) : (
        <>
          {reward ? (
            <p className="mt-3 flex items-center gap-2 text-base font-semibold">
              <span className="text-xl">{reached ? '🏆' : '🎁'}</span>
              <span className="truncate">{reward.reward_title}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={onConfigure}
              className="mt-3 w-full rounded-xl border border-dashed border-line px-3 py-2 text-left text-sm text-ink/55 hover:border-ink/30 hover:text-ink"
            >
              🎁 Aucune récompense définie — <span className="font-semibold underline underline-offset-2">en choisir une</span>
            </button>
          )}

          <div className="mt-4 flex items-baseline justify-between">
            <p className="font-display text-3xl tabular-nums">
              {points}
              <span className="text-lg text-ink/40"> / {planned} pts</span>
            </p>
            <p className={`text-sm font-semibold tabular-nums ${reached ? 'text-emerald-600' : 'text-ink/60'}`}>{pct}%</p>
          </div>

          <div className="relative mt-2 pb-5">
            <div
              className="h-3 overflow-hidden rounded-full bg-paper ring-1 ring-inset ring-line"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={planned}
              aria-valuenow={points}
              aria-label={`Progression : ${pct} % des points planifiés, seuil de récompense à ${REWARD_TARGET_PERCENT} %`}
            >
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${
                  reached ? 'bg-emerald-500' : 'bg-ink'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Repère du seuil de récompense */}
            <div
              className="pointer-events-none absolute -top-1 h-5 w-0.5 -translate-x-1/2 rounded-full bg-ink/70"
              style={{ left: `${REWARD_TARGET_PERCENT}%` }}
              aria-hidden
            />
            <span
              className={`absolute bottom-0 -translate-x-1/2 text-[10px] font-semibold tabular-nums ${
                reached ? 'text-emerald-600' : 'text-ink/55'
              }`}
              style={{ left: `${REWARD_TARGET_PERCENT}%` }}
              aria-hidden
            >
              {REWARD_TARGET_PERCENT} %
            </span>
          </div>
          <p className="text-xs text-ink/50">
            Objectif : {target} pts ({REWARD_TARGET_PERCENT} % de {planned} pts planifiés)
          </p>

          {target === 0 ? (
            <p className="mt-3 text-sm text-ink/50">Aucune tâche planifiée cette semaine.</p>
          ) : reached ? (
            <div className="mt-4 animate-bounce-in">
              <p className="text-sm font-semibold text-emerald-700">🎉 Objectif atteint, bravo !</p>
              {!reward ? (
                <p className="mt-2 text-sm text-ink/60">Définissez une récompense pour pouvoir la réclamer.</p>
              ) : reward.is_claimed ? (
                <p className="mt-2 rounded-xl bg-emerald-100/70 px-3 py-2 text-sm text-emerald-800">✓ Récompense réclamée — profitez-en !</p>
              ) : (
                <button type="button" onClick={claim} disabled={upsert.isPending} className="btn-primary mt-2 w-full bg-emerald-600 hover:bg-emerald-700">
                  Réclamer ma récompense
                </button>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/60">
              Plus que <strong className="text-ink">{target - points} pts</strong> pour débloquer la récompense.
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-xs">
            <div>
              <dt className="text-ink/45">Tâches validées</dt>
              <dd className="font-semibold tabular-nums">
                {data?.tasks_done} / {data?.tasks_total}
              </dd>
            </div>
            <div>
              <dt className="text-ink/45">Points planifiés</dt>
              <dd className="font-semibold tabular-nums">{planned} pts</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
