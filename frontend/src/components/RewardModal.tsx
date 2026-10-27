import { useState, type FormEvent } from 'react';
import { useUpsertReward } from '../hooks/useRewards';
import type { WeeklyReward } from '../types';
import { REWARD_TARGET_PERCENT } from '../utils/tasks';
import { Modal } from './Modal';

interface RewardModalProps {
  year: number;
  week: number;
  reward: WeeklyReward | null;
  targetPoints: number;
  plannedPoints: number;
  onClose: () => void;
}

const SUGGESTIONS = ['Un resto ce weekend 🍝', 'Soirée cinéma 🎬', 'Un nouveau livre 📚', 'Grasse matinée 😴'];

export function RewardModal({ year, week, reward, targetPoints, plannedPoints, onClose }: RewardModalProps) {
  const upsert = useUpsertReward();
  const [title, setTitle] = useState(reward?.reward_title ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Donnez un nom à la récompense.');
    upsert.mutate(
      { year, week_number: week, reward_title: title.trim() },
      { onSuccess: onClose, onError: (err) => setError(err.message) },
    );
  };

  return (
    <Modal title={`Récompense · semaine ${week}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reward-title" className="field-label">
            Récompense
          </label>
          <input
            id="reward-title"
            autoFocus
            className="input text-base"
            placeholder="Ex : Un resto ce weekend"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTitle(s)}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/70 hover:border-ink/30"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-paper px-4 py-3 text-sm">
          <p className="font-semibold">Objectif calculé automatiquement</p>
          <p className="mt-1 text-ink/60">
            {REWARD_TARGET_PERCENT} % des points planifiés de la semaine, soit actuellement{' '}
            <strong className="text-ink">{targetPoints} pts</strong> sur {plannedPoints} pts. Il s’ajuste dès que vous ajoutez ou
            supprimez une tâche.
          </p>
        </div>

        {error && <p className="rounded-xl bg-mandatory-soft px-3 py-2 text-sm text-mandatory-ink">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button type="submit" disabled={upsert.isPending} className="btn-primary">
            {upsert.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
