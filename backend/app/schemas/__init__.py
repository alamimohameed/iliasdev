from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator

from app.models import TaskType


# --- Tâches -------------------------------------------------------------------

class TaskIn(BaseModel):
    """Corps de POST / PUT /tasks."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    date: date
    start_time: time | None = None
    end_time: time | None = None
    task_type: TaskType
    weight: int = Field(default=1, ge=1)
    is_done: bool = False

    @model_validator(mode="after")
    def check_times(self):
        if self.end_time and not self.start_time:
            raise ValueError("end_time nécessite start_time")
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValueError("end_time doit être après start_time")
        return self


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    date: date
    start_time: time | None
    end_time: time | None
    task_type: TaskType
    weight: int
    is_done: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    # Le front manipule des heures « HH:MM ».
    @field_serializer("start_time", "end_time")
    def format_time(self, value: time | None) -> str | None:
        return value.strftime("%H:%M") if value else None


# --- Récompenses --------------------------------------------------------------

class RewardIn(BaseModel):
    """Corps de POST /rewards/weekly (le quota est calculé, pas envoyé)."""

    year: int = Field(ge=2000, le=2100)
    week_number: int = Field(ge=1, le=53)
    reward_title: str = Field(min_length=1, max_length=255)
    is_claimed: bool | None = None


class RewardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    week_number: int
    reward_title: str
    is_claimed: bool


class WeeklyRewardSummary(BaseModel):
    year: int
    week_number: int
    reward: RewardOut | None
    planned_points: int
    target_points: int
    current_points: int
    is_unlocked: bool
    tasks_done: int
    tasks_total: int


# --- Suivi --------------------------------------------------------------------

class TypeCount(BaseModel):
    total: int = 0
    done: int = 0


class TaskStats(BaseModel):
    tasks_total: int
    tasks_done: int
    completion_rate: int
    points_planned: int
    points_done: int
    by_type: dict[TaskType, TypeCount]


class DailyStats(TaskStats):
    date: date


class WeeklyStats(TaskStats):
    year: int
    week_number: int
    target_points: int
    points_rate: int
    reward_unlocked: bool
    reward_claimed: bool
