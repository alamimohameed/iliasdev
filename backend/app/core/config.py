import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost:5432/todo_planner")

# Origines autorisées à appeler l'API (front Vite en dev).
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# Objectif hebdomadaire = ceil(REWARD_TARGET_RATIO × points planifiés).
REWARD_TARGET_RATIO = "0.8"
