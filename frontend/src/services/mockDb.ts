import type { Task, WeeklyReward } from '../types';
import { buildSeed } from './mockData';

/**
 * Faux backend : les données vivent dans le localStorage du navigateur.
 * À remplacer par des appels HTTP vers FastAPI une fois le backend disponible.
 */
interface MockDb {
  tasks: Task[];
  rewards: WeeklyReward[];
}

// v2 : type `urgent`, `completed_at`, quota de récompense calculé.
const STORAGE_KEY = 'todo-planner:mock-db:v2';
const LATENCY_MS = 160;

let cache: MockDb | null = null;

export function loadDb(): MockDb {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw) as MockDb;
      return cache;
    }
  } catch {
    // stockage indisponible ou corrompu : on repart du jeu de démo
  }
  cache = buildSeed();
  saveDb(cache);
  return cache;
}

export function saveDb(db: MockDb) {
  cache = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // mode privé / quota : les données restent en mémoire
  }
}

export function resetDb() {
  saveDb(buildSeed());
}

/** Simule la latence réseau. */
export const networkDelay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

export class NotFoundError extends Error {}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
