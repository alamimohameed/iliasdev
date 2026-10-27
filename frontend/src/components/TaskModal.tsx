import { useState, type FormEvent } from 'react';
import { useCreateTask, useDeleteTask, useUpdateTask } from '../hooks/useTasks';
import type { Task, TaskInput, TaskType } from '../types';
import { TASK_TYPE_META, TASK_TYPES } from '../utils/tasks';
import { Modal } from './Modal';

export interface TaskDraft {
  date: string;
  start_time?: string | null;
  end_time?: string | null;
}

interface TaskModalProps {
  /** Tâche à modifier ; absente = création. */
  task?: Task;
  draft?: TaskDraft;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  task_type: TaskType;
  weight: string;
  is_done: boolean;
}

const WEIGHT_PRESETS = [1, 2, 3, 5];

export function TaskModal({ task, draft, onClose }: TaskModalProps) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    title: task?.title ?? '',
    description: task?.description ?? '',
    date: task?.date ?? draft?.date ?? '',
    start_time: task?.start_time ?? draft?.start_time ?? '',
    end_time: task?.end_time ?? draft?.end_time ?? '',
    task_type: task?.task_type ?? 'mandatory',
    weight: String(task?.weight ?? 1),
    is_done: task?.is_done ?? false,
  }));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const busy = create.isPending || update.isPending || remove.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const weight = Number(form.weight);
    if (!form.title.trim()) return setError('Le nom de la tâche est requis.');
    if (!form.date) return setError('Choisissez une date.');
    if (form.end_time && !form.start_time) return setError('Indiquez une heure de début.');
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
      return setError('L’heure de fin doit être après l’heure de début.');
    if (!Number.isInteger(weight) || weight < 1) return setError('Le poids doit être un entier ≥ 1.');

    const input: TaskInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: form.date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      task_type: form.task_type,
      weight,
      is_done: form.is_done,
    };
    const opts = { onSuccess: onClose, onError: (err: Error) => setError(err.message) };
    if (task) update.mutate({ id: task.id, input }, opts);
    else create.mutate(input, opts);
  };

  const handleDelete = () => {
    if (!task) return;
    if (!confirmDelete) return setConfirmDelete(true);
    remove.mutate(task.id, { onSuccess: onClose, onError: (err) => setError(err.message) });
  };

  return (
    <Modal title={task ? 'Modifier la tâche' : 'Nouvelle tâche'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="field-label">
            Nom de la tâche
          </label>
          <input
            id="title"
            autoFocus
            className="input text-base"
            placeholder="Ex : Préparer la réunion de lundi"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>

        <fieldset>
          <legend className="field-label">Type de tâche</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TASK_TYPES.map((type) => {
              const meta = TASK_TYPE_META[type];
              const active = form.task_type === type;
              return (
                <label
                  key={type}
                  className={`cursor-pointer rounded-2xl border-2 p-2.5 text-center transition ${
                    active ? `${meta.borderStrong} ${meta.soft}` : 'border-line hover:border-ink/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="task_type"
                    value={type}
                    checked={active}
                    onChange={() => set('task_type', type)}
                    className="sr-only"
                  />
                  <span className="block text-lg leading-none">{meta.emoji}</span>
                  <span className={`mt-1 block text-sm font-semibold ${active ? meta.text : ''}`}>{meta.label}</span>
                  <span className="mt-0.5 hidden text-[11px] leading-tight text-ink/50 sm:block">{meta.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className="field-label">
              Date
            </label>
            <input id="date" type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <div>
              <label htmlFor="start" className="field-label">
                Début
              </label>
              <input id="start" type="time" className="input" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} />
            </div>
            <div>
              <label htmlFor="end" className="field-label">
                Fin
              </label>
              <input id="end" type="time" className="input" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} />
            </div>
          </div>
        </div>
        {form.task_type === 'fixed' && !form.start_time && (
          <p className="-mt-2 rounded-xl bg-fixed-soft px-3 py-2 text-xs text-fixed-ink">
            Conseil : une tâche fixe est ancrée dans le temps, définissez de préférence un créneau horaire.
          </p>
        )}

        <div>
          <label htmlFor="weight" className="field-label">
            Poids (points)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="weight"
              type="number"
              min={1}
              step={1}
              className="input w-24"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
            />
            {WEIGHT_PRESETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => set('weight', String(w))}
                className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
                  form.weight === String(w) ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink/30'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="field-label">
            Description <span className="normal-case tracking-normal text-ink/35">(optionnel)</span>
          </label>
          <textarea
            id="description"
            rows={2}
            className="input resize-none"
            placeholder="Détails, lien, adresse…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {task && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.is_done}
              onChange={(e) => set('is_done', e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            Tâche terminée
          </label>
        )}

        {error && <p className="rounded-xl bg-mandatory-soft px-3 py-2 text-sm text-mandatory-ink">{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-1">
          {task ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                confirmDelete ? 'bg-mandatory text-white' : 'text-mandatory hover:bg-mandatory-soft'
              }`}
            >
              {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Enregistrement…' : task ? 'Enregistrer' : 'Ajouter la tâche'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
