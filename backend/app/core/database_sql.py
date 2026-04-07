"""SQLAlchemy + SQLite scaffolding for future persistence migration.

This module provides the database engine, session factory, and ORM base class
that will be used when migrating from the current in-memory datastore
(app.core.database) to a persistent SQLite/PostgreSQL backend.

See docs/adr/0001-in-memory-datastore.md for the migration plan.
"""
from __future__ import annotations

import os

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
)
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./netai.db")
# Expected formats:
#   SQLite (development):   sqlite:///./netai.db  or  sqlite:////abs/path/netai.db
#   PostgreSQL (production): postgresql://user:password@host:5432/dbname

engine = create_engine(
    DATABASE_URL,
    # Required for SQLite to work across threads (FastAPI uses a thread pool)
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


# ---------------------------------------------------------------------------
# ORM model skeletons — mirrors the Pydantic models in app.core.models
# ---------------------------------------------------------------------------

class DeviceORM(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    ip = Column(String, nullable=False)
    status = Column(String, nullable=False, default="online")
    cpu_usage = Column(Float, default=0.0)
    memory_usage = Column(Float, default=0.0)
    disk_usage = Column(Float, default=0.0)
    uptime = Column(Integer, default=0)
    firmware_version = Column(String, nullable=False, default="")
    location = Column(String, nullable=False, default="")
    model = Column(String, nullable=True)
    vendor = Column(String, nullable=True)


class AlertORM(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    device_id = Column(String, nullable=True)
    device_name = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)


class ThreatAlertORM(Base):
    __tablename__ = "threat_alerts"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    source_ip = Column(String, nullable=False)
    destination_ip = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    detected_at = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="active")
    confidence = Column(Float, default=0.0)
    mitre_technique = Column(String, nullable=True)


class ConfigChangeORM(Base):
    __tablename__ = "config_changes"

    id = Column(String, primary_key=True, index=True)
    device_id = Column(String, nullable=False, index=True)
    change_type = Column(String, nullable=False)
    previous_config = Column(Text, nullable=True)
    new_config = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    comment = Column(String, default="")
    timestamp = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="applied")
    compliance = Column(Boolean, nullable=True)


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a DB session per request
# ---------------------------------------------------------------------------

def get_db():
    """Yield a SQLAlchemy session; close on completion."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
