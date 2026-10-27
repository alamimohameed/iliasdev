# Tempo — Frontend (Todo & Organisation)

Front React + Vite + Tailwind + TypeScript, conforme à `../Spec/Spec_front.md`.
Les données viennent de l'API FastAPI (`../backend`), qui doit être lancée avant le front.

```bash
npm install
npm run dev      # http://localhost:5173 — `/api` est relayé vers http://localhost:8000
npm run build
```

Variables d'environnement (facultatives, dans `.env.local`) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `API_PROXY_TARGET` | `http://localhost:8000` | Cible du proxy `/api` de `npm run dev` |
| `VITE_API_URL` | `/api/v1` | URL de base de l'API (à définir pour un build déployé sur un autre domaine) |

## Structure

```
src/
├── components/         Header, TaskModal, TaskItem, RewardWidget, RewardModal…
│   └── calendar/       CalendarView + DayView / WeekView / MonthView / TrackingView (onglet « Suivi »)
├── hooks/              useTasks, useRewards, useStats (React Query)
├── services/           tasksService, rewardsService, statsService → appels à l'API FastAPI
│   └── api.ts          client fetch (URL de base, erreurs `detail` de FastAPI)
├── types/              Task, TaskType, WeeklyReward…
└── utils/              dates (fr, semaines ISO), métadonnées des types de tâches
```

Chaque méthode des services indique l'endpoint qu'elle appelle (`GET /api/v1/tasks?start_date&end_date`, …).

L'objectif de récompense vaut 80 % des points planifiés de la semaine (`REWARD_TARGET_PERCENT` dans `utils/tasks.ts`).

Après une modification de `tailwind.config.js`, redémarrez `npm run dev` pour que les nouvelles couleurs soient prises en compte.