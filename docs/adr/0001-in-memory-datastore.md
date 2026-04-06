# ADR 0001 — In-Memory Datastore

**Status:** Accepted (pending migration)  
**Date:** 2026-04-06  
**Deciders:** netAI core team

---

## Context

netAI's backend requires a persistent store for devices, alerts, threat events,
configuration changes, and software update records. At initial build time the
goal was to deliver a fully functional, demo-ready API as fast as possible.

## Decision

Use a **Python in-memory list/dict datastore** (`backend/app/core/database.py`)
seeded with realistic sample data at startup.

All service modules (`device_service`, `threat_service`, etc.) import the module
directly; no SQL or ORM layer is involved.

## Consequences

### Positive
- Zero external dependencies; runs out of the box with `pip install -r requirements.txt`
- All 57 API endpoints work immediately without a database server
- Ideal for demos, screenshots, and CI smoke tests

### Negative
- **Data loss on every restart** — no persistence across deployments
- No concurrent write safety (Python GIL provides some protection but no true atomicity)
- Cannot scale horizontally without external state

---

## Migration Path to SQLite / PostgreSQL

The scaffolding for this migration already exists in
`backend/app/core/database_sql.py` and `backend/alembic/`.

### Step 1 — ORM models

`database_sql.py` contains SQLAlchemy ORM classes (`DeviceORM`, `AlertORM`, etc.)
that mirror the Pydantic models in `app.core.models`.

### Step 2 — Alembic initial migration

```bash
cd backend
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### Step 3 — Swap service layer

Replace direct list access in each service (e.g., `return db.devices_db`) with
SQLAlchemy queries using the `get_db` dependency injected into routes.

Example refactor of `device_service.get_all_devices`:

```python
# Before (in-memory)
def get_all_devices() -> List[Device]:
    return db.devices_db

# After (SQLAlchemy)
def get_all_devices(session: Session) -> List[Device]:
    return session.query(DeviceORM).all()
```

### Step 4 — Environment variable

Set `DATABASE_URL` to switch between backends:

```
DATABASE_URL=sqlite:///./netai.db           # local dev
DATABASE_URL=postgresql://user:pw@host/db   # production
```

### Step 5 — Remove sample seed data

Once the DB is populated via real network discovery, the seed data in
`database.py` can be removed. Keep it as a `--seed` CLI flag for demos.
