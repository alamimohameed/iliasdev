import type { Task, TaskInput } from '../types';
import { compareTasks } from '../utils/tasks';
import { request } from './api';

export const tasksService = {
  /** GET /api/v1/tasks?start_date={date}&end_date={date} */
  async list(startDate: string, endDate: string): Promise<Task[]> {
    const tasks = await request<Task[]>('GET', '/tasks', { query: { start_date: startDate, end_date: endDate } });
    // Ordre d'affichage propre au front (urgentes sans horaire en tête).
    return tasks.sort(compareTasks);
  },

  /** POST /api/v1/tasks */
  create: (input: TaskInput) => request<Task>('POST', '/tasks', { body: input }),

  /** PUT /api/v1/tasks/{task_id} */
  update: (id: number, input: TaskInput) => request<Task>('PUT', `/tasks/${id}`, { body: input }),

  /** PATCH /api/v1/tasks/{task_id}/status */
  toggleStatus: (id: number) => request<Task>('PATCH', `/tasks/${id}/status`),

  /** DELETE /api/v1/tasks/{task_id} */
  remove: (id: number) => request<void>('DELETE', `/tasks/${id}`),
};
