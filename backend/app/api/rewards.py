from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import WeeklyReward
from app.schemas import RewardIn, RewardOut, WeeklyRewardSummary
from app.services.stats import get_reward, is_unlocked, summarize, target_points, tasks_between, week_bounds

router = APIRouter(prefix="/rewards", tags=["rewards"])


def _summary(db: Session, year: int, week: int) -> WeeklyRewardSummary:
    stats = summarize(tasks_between(db, *week_bounds(year, week)))
    target = target_points(stats.points_planned)
    reward = get_reward(db, year, week)
    return WeeklyRewardSummary(
        year=year,
        week_number=week,
        reward=RewardOut.model_validate(reward) if reward else None,
        planned_points=stats.points_planned,
        target_points=target,
        current_points=stats.points_done,
        is_unlocked=is_unlocked(stats.points_done, target),
        tasks_done=stats.tasks_done,
        tasks_total=stats.tasks_total,
    )


@router.get("/weekly", response_model=WeeklyRewardSummary)
def get_weekly(year: int = Query(ge=2000, le=2100), week: int = Query(ge=1, le=53), db: Session = Depends(get_db)):
    return _summary(db, year, week)


@router.post("/weekly", response_model=RewardOut)
def upsert_weekly(payload: RewardIn, db: Session = Depends(get_db)):
    if payload.is_claimed and not _summary(db, payload.year, payload.week_number).is_unlocked:
        raise HTTPException(status.HTTP_409_CONFLICT, "Objectif de la semaine non atteint : récompense non réclamable")

    reward = get_reward(db, payload.year, payload.week_number)
    if reward is None:
        reward = WeeklyReward(year=payload.year, week_number=payload.week_number, is_claimed=False)
        db.add(reward)
    reward.reward_title = payload.reward_title
    if payload.is_claimed is not None:
        reward.is_claimed = payload.is_claimed
    db.commit()
    db.refresh(reward)
    return reward
