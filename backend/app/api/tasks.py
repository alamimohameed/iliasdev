from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Task
from app.schemas import TaskIn, TaskOut
from app.services.stats import tasks_between

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _get_or_404(db: Session, task_id: int) -> Task:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tâche introuvable")
    return task


def _set_done(task: Task, is_done: bool) -> None:
    if is_done and not task.is_done:
        task.completed_at = datetime.now(timezone.utc)
    elif not is_done:
        task.completed_at = None
    task.is_done = is_done


@router.get("", response_model=list[TaskOut])
def list_tasks(start_date: date, end_date: date, db: Session = Depends(get_db)):
    if end_date < start_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "end_date doit être ≥ start_date")
    return tasks_between(db, start_date, end_date)


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskIn, db: Session = Depends(get_db)):
    task = Task(**payload.model_dump(exclude={"is_done"}), is_done=False)
    _set_done(task, payload.is_done)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskIn, db: Session = Depends(get_db)):
    task = _get_or_404(db, task_id)
    for field, value in payload.model_dump(exclude={"is_done"}).items():
        setattr(task, field, value)
    _set_done(task, payload.is_done)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=TaskOut)
def toggle_status(task_id: int, db: Session = Depends(get_db)):
    task = _get_or_404(db, task_id)
    _set_done(task, not task.is_done)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, task_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
