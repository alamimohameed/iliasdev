"""Logique métier : objectif à 80 % et agrégations de suivi."""

import math
from collections.abc import Iterable
from datetime import date, timedelta
from fractions import Fraction

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import REWARD_TARGET_RATIO
from app.models import Task, TaskType, WeeklyReward
from app.schemas import TaskStats, TypeCount

# Fraction exacte : évite ceil(0.8 * 35) = 29 à cause de l'arrondi flottant.
_RATIO = Fraction(REWARD_TARGET_RATIO)


def target_points(planned: int) -> int:
    return math.ceil(_RATIO * planned)


def is_unlocked(done: int, target: int) -> bool:
    return target > 0 and done >= target


def week_bounds(year: int, week: int) -> tuple[date, date]:
    monday = date.fromisocalendar(year, week, 1)
    return monday, monday + timedelta(days=6)


def tasks_between(db: Session, start: date, end: date) -> list[Task]:
    stmt = (
        select(Task)
        .where(Task.date.between(start, end))
        .order_by(Task.date, Task.start_time.nulls_last(), Task.id)
    )
    return list(db.scalars(stmt))


def get_reward(db: Session, year: int, week: int) -> WeeklyReward | None:
    return db.scalar(select(WeeklyReward).where(WeeklyReward.year == year, WeeklyReward.week_number == week))


def summarize(tasks: Iterable[Task]) -> TaskStats:
    by_type = {t: TypeCount() for t in TaskType}
    total = done = planned = done_points = 0
    for task in tasks:
        total += 1
        planned += task.weight
        by_type[task.task_type].total += 1
        if task.is_done:
            done += 1
            done_points += task.weight
            by_type[task.task_type].done += 1
    return TaskStats(
        tasks_total=total,
        tasks_done=done,
        completion_rate=round(done * 100 / total) if total else 0,
        points_planned=planned,
        points_done=done_points,
        by_type=by_type,
    )
