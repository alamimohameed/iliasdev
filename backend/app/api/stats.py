from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import WeeklyReward
from app.schemas import DailyStats, WeeklyStats
from app.services.stats import is_unlocked, summarize, target_points, tasks_between, week_bounds

router = APIRouter(prefix="/stats", tags=["stats"])

MAX_DAYS = 366
MAX_WEEKS = 104


@router.get("/daily", response_model=list[DailyStats])
def daily(start_date: date, end_date: date, db: Session = Depends(get_db)):
    days = (end_date - start_date).days + 1
    if not 1 <= days <= MAX_DAYS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Intervalle invalide (1 à {MAX_DAYS} jours)")

    by_day = defaultdict(list)
    for task in tasks_between(db, start_date, end_date):
        by_day[task.date].append(task)

    result = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        result.append(DailyStats(date=d, **summarize(by_day[d]).model_dump()))
    return result


@router.get("/weekly", response_model=list[WeeklyStats])
def weekly(
    start_year: int = Query(ge=2000, le=2100),
    start_week: int = Query(ge=1, le=53),
    end_year: int = Query(ge=2000, le=2100),
    end_week: int = Query(ge=1, le=53),
    db: Session = Depends(get_db),
):
    try:
        first_monday, _ = week_bounds(start_year, start_week)
        last_monday, last_sunday = week_bounds(end_year, end_week)
    except ValueError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Semaine ISO invalide")
    weeks = (last_monday - first_monday).days // 7 + 1
    if not 1 <= weeks <= MAX_WEEKS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Intervalle invalide (1 à {MAX_WEEKS} semaines)")

    by_week = defaultdict(list)
    for task in tasks_between(db, first_monday, last_sunday):
        by_week[task.date.isocalendar()[:2]].append(task)
    claimed = {
        (r.year, r.week_number)
        for r in db.scalars(select(WeeklyReward).where(WeeklyReward.is_claimed.is_(True)))
    }

    result = []
    for i in range(weeks):
        year, week, _ = (first_monday + timedelta(weeks=i)).isocalendar()
        stats = summarize(by_week[(year, week)])
        target = target_points(stats.points_planned)
        result.append(
            WeeklyStats(
                year=year,
                week_number=week,
                **stats.model_dump(),
                target_points=target,
                # Arrondi à l'inférieur : jamais « 80 % » avant d'avoir réellement atteint le seuil.
                points_rate=stats.points_done * 100 // stats.points_planned if stats.points_planned else 0,
                reward_unlocked=is_unlocked(stats.points_done, target),
                reward_claimed=(year, week) in claimed,
            )
        )
    return result
