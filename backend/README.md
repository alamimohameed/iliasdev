# Tempo — Backend (FastAPI + PostgreSQL)

API de l'app Todo & Organisation, conforme à `../Spec/Spec_front.md`.

## Lancer en local

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

createdb todo_planner          # une seule fois (PostgreSQL doit tourner)
alembic upgrade head           # crée les tables

uvicorn app.main:app --reload  # http://localhost:8000 — doc interactive : /docs
```

Variables d'environnement (facultatives) :

| Variable | Défaut |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://localhost:5432/todo_planner` |
| `CORS_ORIGINS` | `http://localhost:5173` (séparées par des virgules) |

## Endpoints (`/api/v1`)

| Méthode | Route | Rôle |
| --- | --- | --- |
| GET | `/tasks?start_date&end_date` | Tâches d'un intervalle |
| POST | `/tasks` | Créer une tâche |
| PUT | `/tasks/{id}` | Modifier une tâche |
| PATCH | `/tasks/{id}/status` | Basculer `is_done` (met à jour `completed_at`) |
| DELETE | `/tasks/{id}` | Supprimer une tâche |
| GET | `/rewards/weekly?year&week` | Récompense + points (objectif = 80 % des points planifiés) |
| POST | `/rewards/weekly` | Définir le titre / réclamer (409 si objectif non atteint) |
| GET | `/stats/daily?start_date&end_date` | Suivi jour par jour |
| GET | `/stats/weekly?start_year&start_week&end_year&end_week` | Suivi semaine par semaine |

## Structure

```
app/
├── api/        tasks.py, rewards.py, stats.py (routeurs)
├── core/       config.py (DATABASE_URL, REWARD_TARGET_RATIO), database.py
├── models/     Task, TaskType, WeeklyReward
├── schemas/    modèles Pydantic d'entrée / sortie
├── services/   stats.py — calcul de l'objectif 80 % et agrégations
└── main.py
alembic/        migrations
```
