from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import rewards, stats, tasks
from app.core.config import CORS_ORIGINS

app = FastAPI(title="Tempo · Todo & Organisation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (tasks, rewards, stats):
    app.include_router(module.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
