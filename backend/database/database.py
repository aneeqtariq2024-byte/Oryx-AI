"""ORYX database — SQLite with async-compatible session management via aiosqlite."""

import sqlite3
import json
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager

from backend.config import settings


class Database:
    def __init__(self, db_path: str | None = None):
        self.db_path = db_path or settings.DB_PATH
        self._conn: sqlite3.Connection | None = None

    # ------------------------------------------------------------------
    # Connection helpers
    # ------------------------------------------------------------------
    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    @contextmanager
    def get_connection(self):
        conn = self._connect()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Schema bootstrap
    # ------------------------------------------------------------------
    def init_tables(self):
        with self.get_connection() as conn:
            conn.executescript(SCHEMA_SQL)

    # ------------------------------------------------------------------
    # Generic CRUD
    # ------------------------------------------------------------------
    def insert(self, table: str, data: dict) -> int:
        cols = ", ".join(data.keys())
        placeholders = ", ".join([":" + k for k in data.keys()])
        sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders})"
        with self.get_connection() as conn:
            cursor = conn.execute(sql, data)
            return cursor.lastrowid

    def update(self, table: str, row_id: int, data: dict):
        set_clause = ", ".join([f"{k} = :{k}" for k in data.keys()])
        sql = f"UPDATE {table} SET {set_clause} WHERE id = :id"
        data["id"] = row_id
        with self.get_connection() as conn:
            conn.execute(sql, data)

    def delete(self, table: str, row_id: int):
        with self.get_connection() as conn:
            conn.execute(f"DELETE FROM {table} WHERE id = ?", (row_id,))

    def fetch_one(self, table: str, row_id: int) -> dict | None:
        with self.get_connection() as conn:
            row = conn.execute(f"SELECT * FROM {table} WHERE id = ?", (row_id,)).fetchone()
            return dict(row) if row else None

    def fetch_all(self, table: str, **filters) -> list[dict]:
        if not filters:
            sql = f"SELECT * FROM {table}"
        else:
            where = " AND ".join([f"{k} = :{k}" for k in filters])
            sql = f"SELECT * FROM {table} WHERE {where}"
        with self.get_connection() as conn:
            rows = conn.execute(sql, filters).fetchall()
            return [dict(r) for r in rows]

    def execute_sql(self, sql: str, params: tuple = ()) -> list[dict]:
        with self.get_connection() as conn:
            rows = conn.execute(sql, params).fetchall()
            return [dict(r) for r in rows]


# Global singleton
db = Database()


# ------------------------------------------------------------------
# Schema
# ------------------------------------------------------------------
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    remind_at TEXT NOT NULL,
    fired INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT DEFAULT 'general',
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT,
    action TEXT,
    target TEXT,
    status TEXT DEFAULT 'success',
    details TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT,
    action TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','expired')),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    resolved_at TEXT
);
"""
