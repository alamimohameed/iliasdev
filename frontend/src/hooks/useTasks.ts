import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { tasksService } from '../services/tasksService';
import type { Task, TaskInput } from '../types';

export const taskKeys = {
  all: ['tasks'] as const,
  range: (start: string, end: string) => ['tasks', start, end] as const,
};

// Toute modification de tâche peut changer le score hebdomadaire et le suivi.
const invalidateAll = (qc: QueryClient) =>
  Promise.all(
    [taskKeys.all, ['rewards'], ['stats']].map((queryKey) => qc.invalidateQueries({ queryKey })),
  );

export function useTasks(start: string, end: string) {
  return useQuery({
    queryKey: taskKeys.range(start, end),
    queryFn: () => tasksService.list(start, end),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => tasksService.create(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => tasksService.update(id, input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
}

/** Bascule `is_done` avec mise à jour optimiste pour une checkbox instantanée. */
export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.toggleStatus(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = qc.getQueriesData<Task[]>({ queryKey: taskKeys.all });
      qc.setQueriesData<Task[]>({ queryKey: taskKeys.all }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, is_done: !t.is_done } : t)),
      );
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => invalidateAll(qc),
  });
}
