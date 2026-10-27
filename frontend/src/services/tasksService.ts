import type { Task, TaskInput } from '../types';
import { compareTasks } from '../utils/tasks';
import { loadDb, networkDelay, newId, NotFoundError, saveDb } from './mockDb';

/** Implémentation fictive de `/api/v1/tasks`. Chaque méthode documente l'endpoint qu'elle remplace. */
export const tasksService = {
  /** GET /api/v1/tasks?start_date={date}&end_date={date} */
  async list(startDate: string, endDate: string): Promise<Task[]> {
    await networkDelay();
    return loadDb()
      .tasks.filter((t) => t.date >= startDate && t.date <= endDate)
      .sort(compareTasks)
      .map((t) => ({ ...t }));
  },

  /** POST /api/v1/tasks */
  async create(input: TaskInput): Promise<Task> {
    await networkDelay();
    const db = loadDb();
    const now = new Date().toISOString();
    const isDone = input.is_done ?? false;
    const task: Task = {
      ...input,
      is_done: isDone,
      completed_at: isDone ? now : null,
      id: newId(),
      created_at: now,
      updated_at: now,
    };
    saveDb({ ...db, tasks: [...db.tasks, task] });
    return { ...task };
  },

  /** PUT /api/v1/tasks/{task_id} */
  async update(id: string, input: TaskInput): Promise<Task> {
    await networkDelay();
    const db = loadDb();
    const existing = db.tasks.find((t) => t.id === id);
    if (!existing) throw new NotFoundError('Tâche introuvable');
    const now = new Date().toISOString();
    const isDone = input.is_done ?? existing.is_done;
    const task: Task = {
      ...existing,
      ...input,
      is_done: isDone,
      completed_at: !isDone ? null : existing.is_done ? existing.completed_at : now,
      updated_at: now,
    };
    saveDb({ ...db, tasks: db.tasks.map((t) => (t.id === id ? task : t)) });
    return { ...task };
  },

  /** PATCH /api/v1/tasks/{task_id}/status */
  async toggleStatus(id: string): Promise<Task> {
    await networkDelay();
    const db = loadDb();
    const existing = db.tasks.find((t) => t.id === id);
    if (!existing) throw new NotFoundError('Tâche introuvable');
    const now = new Date().toISOString();
    const isDone = !existing.is_done;
    const task: Task = { ...existing, is_done: isDone, completed_at: isDone ? now : null, updated_at: now };
    saveDb({ ...db, tasks: db.tasks.map((t) => (t.id === id ? task : t)) });
    return { ...task };
  },

  /** DELETE /api/v1/tasks/{task_id} */
  async remove(id: string): Promise<void> {
    await networkDelay();
    const db = loadDb();
    if (!db.tasks.some((t) => t.id === id)) throw new NotFoundError('Tâche introuvable');
    saveDb({ ...db, tasks: db.tasks.filter((t) => t.id !== id) });
  },
};
