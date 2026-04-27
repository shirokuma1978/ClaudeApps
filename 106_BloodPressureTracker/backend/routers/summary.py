from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/monthly", response_model=schemas.MonthlySummary)
def monthly_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    month_str = today.strftime("%Y-%m")

    rows = (
        db.query(models.BPRecord)
        .filter(
            models.BPRecord.user_id == current_user.id,
            func.strftime("%Y-%m", models.BPRecord.measured_date) == month_str,
        )
        .all()
    )

    count = len(rows)
    if count == 0:
        return schemas.MonthlySummary(
            month=month_str,
            avg_systolic=0,
            avg_diastolic=0,
            avg_pulse=None,
            count=0,
        )

    avg_sys = sum(r.systolic for r in rows) / count
    avg_dia = sum(r.diastolic for r in rows) / count
    pulses = [r.pulse for r in rows if r.pulse is not None]
    avg_pulse = sum(pulses) / len(pulses) if pulses else None

    return schemas.MonthlySummary(
        month=month_str,
        avg_systolic=round(avg_sys, 1),
        avg_diastolic=round(avg_dia, 1),
        avg_pulse=round(avg_pulse, 1) if avg_pulse else None,
        count=count,
    )
