export type TaskType = 'urgent' | 'mandatory' | 'optional' | 'fixed';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'tracking';

/** Miroir de la table `tasks`. Dates en `YYYY-MM-DD`, heures en `HH:MM`. */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  task_type: TaskType;
  weight: number;
  is_done: boolean;
  /** Horodatage du passage à `is_done = true`, `null` sinon. */
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Corps des requêtes POST / PUT `/api/v1/tasks`. */
export interface TaskInput {
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  task_type: TaskType;
  weight: number;
  is_done?: boolean;
}

/** Miroir de la table `weekly_rewards` (le quota est calculé, pas stocké). */
export interface WeeklyReward {
  id: string;
  year: number;
  week_number: number;
  reward_title: string;
  is_claimed: boolean;
}

/** Corps de la requête POST `/api/v1/rewards/weekly`. */
export interface WeeklyRewardInput {
  year: number;
  week_number: number;
  reward_title: string;
  is_claimed?: boolean;
}

/** Réponse de GET `/api/v1/rewards/weekly` : récompense + valeurs calculées (règle 2.4). */
export interface WeeklyRewardSummary {
  year: number;
  week_number: number;
  reward: WeeklyReward | null;
  /** Somme des `weight` de toutes les tâches de la semaine. */
  planned_points: number;
  /** ceil(80 % × planned_points). */
  target_points: number;
  /** Somme des `weight` des tâches de la semaine avec `is_done = true`. */
  current_points: number;
  is_unlocked: boolean;
  tasks_done: number;
  tasks_total: number;
}

export type TypeBreakdown = Record<TaskType, { total: number; done: number }>;

export interface TaskStats {
  tasks_total: number;
  tasks_done: number;
  /** Pourcentage entier 0–100. */
  completion_rate: number;
  points_planned: number;
  points_done: number;
  by_type: TypeBreakdown;
}

/** Élément de GET `/api/v1/stats/daily`. */
export interface DailyStats extends TaskStats {
  date: string;
}

/** Élément de GET `/api/v1/stats/weekly`. */
export interface WeeklyStats extends TaskStats {
  year: number;
  week_number: number;
  target_points: number;
  /** % des points planifiés déjà accumulés (arrondi à l'inférieur), à comparer au seuil de 80 %. */
  points_rate: number;
  reward_unlocked: boolean;
  reward_claimed: boolean;
}
