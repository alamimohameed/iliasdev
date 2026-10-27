# Tempo — Frontend (Todo & Organisation)

Front React + Vite + Tailwind + TypeScript, conforme à `../Spec/Spec_front.md`.
**Aucun backend requis** : les données sont fictives et stockées dans le `localStorage` du navigateur.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

```
src/
├── components/         Header, TaskModal, TaskItem, RewardWidget, RewardModal…
│   └── calendar/       CalendarView + DayView / WeekView / MonthView / TrackingView (onglet « Suivi »)
├── hooks/              useTasks, useRewards, useStats (React Query)
├── services/           tasksService, rewardsService, statsService → mock de l'API FastAPI
│   ├── mockDb.ts       stockage localStorage + latence simulée
│   └── mockData.ts     jeu de données généré autour de la semaine courante
├── types/              Task, TaskType, WeeklyReward…
└── utils/              dates (fr, semaines ISO), métadonnées des types de tâches
```

## Brancher le vrai backend

Chaque méthode de `services/tasksService.ts` et `services/rewardsService.ts` indique l'endpoint
qu'elle simule (`GET /api/v1/tasks?start_date&end_date`, `PATCH /api/v1/tasks/{id}/status`, …).
Il suffit de remplacer leur corps par des appels `fetch`/Axios : les hooks et composants ne changent pas.

L'objectif de récompense vaut 80 % des points planifiés de la semaine (`REWARD_TARGET_PERCENT` dans `utils/tasks.ts`).

Après une modification de `tailwind.config.js`, redémarrez `npm run dev` pour que les nouvelles couleurs soient prises en compte.

Le lien « Réinitialiser » en bas de la barre latérale régénère les données de démo.
