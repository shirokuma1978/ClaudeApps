from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    records = relationship("BPRecord", back_populates="owner")


class BPRecord(Base):
    __tablename__ = "bp_records"
    __table_args__ = (
        Index("idx_bp_measured_at", "measured_at"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    measured_at = Column(DateTime, nullable=False)   # 測定日時（JST）
    systolic = Column(Integer, nullable=False)       # 収縮期血圧（上）
    diastolic = Column(Integer, nullable=False)  # 拡張期血圧（下）
    pulse = Column(Integer)                      # 脈拍
    memo = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    owner = relationship("User", back_populates="records")
