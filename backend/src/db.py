import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).parent.parent / "caller_data.db"


def get_db_connection(db_path: str | Path | None = None) -> sqlite3.Connection:
    target_path = Path(db_path) if db_path else DEFAULT_DB_PATH
    conn = sqlite3.connect(str(target_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str | Path | None = None) -> str:
    """Initialize the SQLite callers table if it does not exist."""
    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS callers (
                    user_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    language_preference TEXT DEFAULT 'Malayalam',
                    facts TEXT DEFAULT '{}',
                    last_interaction TEXT NOT NULL
                )
                """
            )
    finally:
        conn.close()
    return str(db_path or DEFAULT_DB_PATH)


def get_caller(
    user_id: str | None = None,
    name: str | None = None,
    db_path: str | Path | None = None,
) -> dict | None:
    """Retrieve a caller profile by user_id or by name."""
    if not user_id and not name:
        return None

    init_db(db_path)
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        if user_id:
            cursor.execute(
                "SELECT user_id, name, language_preference, facts, last_interaction FROM callers WHERE user_id = ?",
                (user_id,),
            )
            row = cursor.fetchone()
        else:
            cursor.execute(
                "SELECT user_id, name, language_preference, facts, last_interaction FROM callers WHERE LOWER(name) = LOWER(?)",
                (name,),
            )
            row = cursor.fetchone()

        if not row:
            return None

        facts_json = row["facts"]
        try:
            facts_dict = json.loads(facts_json) if facts_json else {}
        except json.JSONDecodeError:
            facts_dict = {}

        return {
            "user_id": row["user_id"],
            "name": row["name"],
            "language_preference": row["language_preference"] or "Malayalam",
            "facts": facts_dict,
            "last_interaction": row["last_interaction"],
        }
    finally:
        conn.close()


def save_caller_data(
    user_id: str,
    name: str,
    language_preference: str = "Malayalam",
    facts: dict | None = None,
    db_path: str | Path | None = None,
) -> dict:
    """Save or update caller information with timestamped last_interaction."""
    init_db(db_path)
    existing = get_caller(user_id=user_id, db_path=db_path)
    
    merged_facts = {}
    if existing and isinstance(existing.get("facts"), dict):
        merged_facts.update(existing["facts"])
    if facts:
        merged_facts.update(facts)

    current_timestamp = datetime.now(timezone.utc).isoformat()
    facts_str = json.dumps(merged_facts)

    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO callers (user_id, name, language_preference, facts, last_interaction)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    name = excluded.name,
                    language_preference = excluded.language_preference,
                    facts = excluded.facts,
                    last_interaction = excluded.last_interaction
                """,
                (user_id, name, language_preference, facts_str, current_timestamp),
            )
    finally:
        conn.close()

    return {
        "user_id": user_id,
        "name": name,
        "language_preference": language_preference,
        "facts": merged_facts,
        "last_interaction": current_timestamp,
    }


def update_last_interaction(
    user_id: str, db_path: str | Path | None = None
) -> str | None:
    """Update last_interaction timestamp for an existing caller."""
    init_db(db_path)
    conn = get_db_connection(db_path)
    current_timestamp = datetime.now(timezone.utc).isoformat()
    try:
        with conn:
            cursor = conn.execute(
                "UPDATE callers SET last_interaction = ? WHERE user_id = ?",
                (current_timestamp, user_id),
            )
            if cursor.rowcount > 0:
                return current_timestamp
            return None
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# Call Log & Call Outcome Tracking Functions                                  #
# --------------------------------------------------------------------------- #

def init_call_logs_table(db_path: str | Path | None = None) -> str:
    """Initialize the SQLite call_logs table if it does not exist."""
    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS call_logs (
                    call_id TEXT PRIMARY KEY,
                    user_id TEXT DEFAULT 'FF001',
                    caller_name TEXT DEFAULT 'Farmer',
                    started_at TEXT NOT NULL,
                    ended_at TEXT NOT NULL,
                    duration_seconds INTEGER DEFAULT 0,
                    outcome TEXT NOT NULL CHECK(outcome IN ('successful', 'failed')),
                    success_condition TEXT NOT NULL,
                    notes TEXT DEFAULT '',
                    created_at TEXT NOT NULL
                )
                """
            )
    finally:
        conn.close()
    return str(db_path or DEFAULT_DB_PATH)


def record_call_outcome(
    call_id: str,
    outcome: str,
    success_condition: str,
    user_id: str = "FF001",
    caller_name: str = "Farmer",
    started_at: str | None = None,
    ended_at: str | None = None,
    duration_seconds: int = 0,
    notes: str = "",
    db_path: str | Path | None = None,
) -> dict:
    """Record or update a call outcome in SQLite call_logs table.
    
    outcome MUST be either 'successful' or 'failed'.
    """
    init_call_logs_table(db_path)
    now_iso = datetime.now(timezone.utc).isoformat()
    start_ts = started_at or now_iso
    end_ts = ended_at or now_iso
    clean_outcome = outcome.lower().strip()
    if clean_outcome not in ("successful", "failed"):
        clean_outcome = "failed"

    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO call_logs (
                    call_id, user_id, caller_name, started_at, ended_at,
                    duration_seconds, outcome, success_condition, notes, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(call_id) DO UPDATE SET
                    user_id = excluded.user_id,
                    caller_name = excluded.caller_name,
                    started_at = excluded.started_at,
                    ended_at = excluded.ended_at,
                    duration_seconds = excluded.duration_seconds,
                    outcome = excluded.outcome,
                    success_condition = excluded.success_condition,
                    notes = excluded.notes
                """,
                (
                    call_id,
                    user_id,
                    caller_name,
                    start_ts,
                    end_ts,
                    duration_seconds,
                    clean_outcome,
                    success_condition,
                    notes,
                    now_iso,
                ),
            )
    finally:
        conn.close()

    return {
        "call_id": call_id,
        "user_id": user_id,
        "caller_name": caller_name,
        "started_at": start_ts,
        "ended_at": end_ts,
        "duration_seconds": duration_seconds,
        "outcome": clean_outcome,
        "success_condition": success_condition,
        "notes": notes,
        "created_at": now_iso,
    }


def update_call_outcome(
    call_id: str,
    outcome: str,
    success_condition: str | None = None,
    notes: str | None = None,
    db_path: str | Path | None = None,
) -> bool:
    """Update outcome of an existing call record by call_id."""
    init_call_logs_table(db_path)
    clean_outcome = outcome.lower().strip()
    if clean_outcome not in ("successful", "failed"):
        return False

    conn = get_db_connection(db_path)
    try:
        with conn:
            if success_condition is not None and notes is not None:
                cursor = conn.execute(
                    "UPDATE call_logs SET outcome = ?, success_condition = ?, notes = ? WHERE call_id = ?",
                    (clean_outcome, success_condition, notes, call_id),
                )
            elif success_condition is not None:
                cursor = conn.execute(
                    "UPDATE call_logs SET outcome = ?, success_condition = ? WHERE call_id = ?",
                    (clean_outcome, success_condition, call_id),
                )
            elif notes is not None:
                cursor = conn.execute(
                    "UPDATE call_logs SET outcome = ?, notes = ? WHERE call_id = ?",
                    (clean_outcome, notes, call_id),
                )
            else:
                cursor = conn.execute(
                    "UPDATE call_logs SET outcome = ? WHERE call_id = ?",
                    (clean_outcome, call_id),
                )
            return cursor.rowcount > 0
    finally:
        conn.close()


def get_call_stats(db_path: str | Path | None = None) -> dict:
    """Return dashboard summary stats: total_calls, successful_calls, failed_calls."""
    init_call_logs_table(db_path)
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM call_logs")
        total_row = cursor.fetchone()
        total_calls = total_row["total"] if total_row else 0

        cursor.execute("SELECT COUNT(*) as success_cnt FROM call_logs WHERE outcome = 'successful'")
        succ_row = cursor.fetchone()
        successful_calls = succ_row["success_cnt"] if succ_row else 0

        cursor.execute("SELECT COUNT(*) as fail_cnt FROM call_logs WHERE outcome = 'failed'")
        fail_row = cursor.fetchone()
        failed_calls = fail_row["fail_cnt"] if fail_row else 0

        success_rate = (successful_calls / total_calls * 100) if total_calls > 0 else 0.0

        return {
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": failed_calls,
            "success_rate": round(success_rate, 1),
        }
    finally:
        conn.close()


def list_call_logs(
    limit: int = 50,
    outcome: str | None = None,
    db_path: str | Path | None = None,
) -> list[dict]:
    """Retrieve call logs sorted by creation timestamp descending."""
    init_call_logs_table(db_path)
    conn = get_db_connection(db_path)
    try:
        cursor = conn.cursor()
        if outcome:
            cursor.execute(
                "SELECT * FROM call_logs WHERE outcome = ? ORDER BY created_at DESC LIMIT ?",
                (outcome.lower().strip(), limit),
            )
        else:
            cursor.execute(
                "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT ?",
                (limit,),
            )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

