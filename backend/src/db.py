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
