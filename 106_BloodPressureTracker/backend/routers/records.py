from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/records", tags=["records"])


@router.get("", response_model=List[schemas.Record])
def get_records(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.BPRecord)
        .filter(models.BPRecord.user_id == current_user.id)
        .order_by(models.BPRecord.measured_at.desc())
        .all()
    )


@router.post("", response_model=schemas.Record, status_code=201)
def create_record(
    record: schemas.RecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_record = models.BPRecord(**record.model_dump(), user_id=current_user.id)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/{record_id}", response_model=schemas.Record)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = (
        db.query(models.BPRecord)
        .filter(
            models.BPRecord.id == record_id,
            models.BPRecord.user_id == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.put("/{record_id}", response_model=schemas.Record)
def update_record(
    record_id: int,
    record: schemas.RecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_record = (
        db.query(models.BPRecord)
        .filter(
            models.BPRecord.id == record_id,
            models.BPRecord.user_id == current_user.id,
        )
        .first()
    )
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    for key, value in record.model_dump().items():
        setattr(db_record, key, value)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete("/{record_id}", status_code=204)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_record = (
        db.query(models.BPRecord)
        .filter(
            models.BPRecord.id == record_id,
            models.BPRecord.user_id == current_user.id,
        )
        .first()
    )
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(db_record)
    db.commit()
