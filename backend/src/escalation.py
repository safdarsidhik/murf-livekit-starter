"""
escalation.py — Human-in-the-loop escalation for Farm & Field AI agent.

TWO ESCALATION TRIGGERS (Step 1):
  1. MISSING / STALE MARKET DATA  — get_market_price returns an error or the
     crop is not in the Agmarknet dataset.  The farmer cannot get a price and
     may make a bad selling decision without human guidance.
  2. SERIOUS CROP PROBLEM REPORTED — the farmer describes severe symptoms
     (widespread leaf blight, sudden mass die-off, unknown pest, total yield
     loss) that exceed the agent's advisory capability and may require an
     agronomist or Krishi Bhavan officer on a callback.

Step 3 — Only the useful details are stored (no passwords, OTPs, account
         numbers, or full conversation transcripts).
Step 5 — Escalations are saved to a local SQLite table and exposed via a
         FastAPI dashboard (see dashboard.py).  A webhook can be added later.
"""

import json
import logging
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Literal, Optional

logger = logging.getLogger("agent.escalation")

DEFAULT_DB_PATH = Path(__file__).parent.parent / "caller_data.db"

# --------------------------------------------------------------------------- #
# Escalation reason constants                                                  #
# --------------------------------------------------------------------------- #
REASON_MISSING_MARKET_DATA = "missing_market_data"
REASON_SERIOUS_CROP_PROBLEM = "serious_crop_problem"

VALID_REASONS = {REASON_MISSING_MARKET_DATA, REASON_SERIOUS_CROP_PROBLEM}

URGENCY_LOW = "low"
URGENCY_MEDIUM = "medium"
URGENCY_HIGH = "high"

FOLLOW_UP_VOICE = "voice_call"
FOLLOW_UP_SMS = "sms"
FOLLOW_UP_WHATSAPP = "whatsapp"

# --------------------------------------------------------------------------- #
# DB initialisation                                                            #
# --------------------------------------------------------------------------- #

def _get_conn(db_path: Optional[Path] = None) -> sqlite3.Connection:
    target = db_path or DEFAULT_DB_PATH
    conn = sqlite3.connect(str(target))
    conn.row_factory = sqlite3.Row
    return conn


def init_escalation_table(db_path: Optional[Path] = None) -> None:
    """Create the escalations table if it does not already exist."""
    conn = _get_conn(db_path)
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS escalations (
                    ref_id          TEXT PRIMARY KEY,
                    reason          TEXT NOT NULL,
                    urgency         TEXT NOT NULL DEFAULT 'medium',
                    caller_name     TEXT,
                    caller_lang     TEXT DEFAULT 'Malayalam',
                    follow_up_pref  TEXT DEFAULT 'voice_call',
                    what_happened   TEXT NOT NULL,
                    already_checked TEXT,
                    crop            TEXT,
                    district        TEXT,
                    status          TEXT NOT NULL DEFAULT 'open',
                    created_at      TEXT NOT NULL,
                    resolved_at     TEXT
                )
                """
            )
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# Core create function (Step 2 + Step 3)                                       #
# --------------------------------------------------------------------------- #

def create_escalation_request(
    reason: Literal["missing_market_data", "serious_crop_problem"],
    what_happened: str,
    *,
    caller_name: str = "Unknown Farmer",
    caller_lang: str = "Malayalam",
    follow_up_pref: str = FOLLOW_UP_VOICE,
    already_checked: str = "",
    crop: str = "",
    district: str = "",
    urgency: str = URGENCY_MEDIUM,
    db_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Persist a human-escalation record and return the reference ID + next steps.

    Parameters (Step 3 — only useful, non-private details):
        reason          : One of VALID_REASONS.
        what_happened   : Short description of the problem (1–3 sentences).
        caller_name     : Farmer's first name only — no phone numbers or IDs.
        caller_lang     : Language the farmer spoke in (e.g. 'Malayalam').
        follow_up_pref  : How the farmer wants to be contacted ('voice_call',
                          'sms', 'whatsapp').
        already_checked : What the agent already tried before escalating.
        crop            : Crop in question (if relevant).
        district        : District (if relevant).
        urgency         : 'low', 'medium', or 'high'.
        db_path         : Override DB path (for testing).

    Returns a dict with:
        ref_id       : Unique escalation reference (e.g. ESC-3F2A).
        status       : Always 'created' on success.
        next_steps   : Human-readable what-happens-next string for the agent
                       to read aloud to the farmer (Step 6).
        summary      : Structured summary dict for logging / webhook.
    """
    if reason not in VALID_REASONS:
        raise ValueError(
            f"Invalid escalation reason '{reason}'. "
            f"Must be one of: {', '.join(VALID_REASONS)}"
        )

    init_escalation_table(db_path)

    # Generate short, human-readable reference ID (Step 6)
    ref_id = "ESC-" + uuid.uuid4().hex[:6].upper()
    created_at = datetime.now(timezone.utc).isoformat()

    # Sanitise — never store raw numbers that look like OTPs / account numbers
    safe_name = (caller_name or "Unknown Farmer")[:80]
    safe_what = (what_happened or "")[:500]
    safe_checked = (already_checked or "")[:300]
    safe_crop = (crop or "")[:60]
    safe_district = (district or "")[:60]

    conn = _get_conn(db_path)
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO escalations
                    (ref_id, reason, urgency, caller_name, caller_lang,
                     follow_up_pref, what_happened, already_checked,
                     crop, district, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
                """,
                (
                    ref_id, reason, urgency, safe_name, caller_lang,
                    follow_up_pref, safe_what, safe_checked,
                    safe_crop, safe_district, created_at,
                ),
            )
    finally:
        conn.close()

    # Build summary (Step 3)
    summary = {
        "ref_id": ref_id,
        "reason": reason,
        "urgency": urgency,
        "who_needs_help": safe_name,
        "language": caller_lang,
        "preferred_follow_up": follow_up_pref,
        "what_happened": safe_what,
        "already_checked": safe_checked,
        "crop": safe_crop,
        "district": safe_district,
        "created_at": created_at,
    }

    logger.info(
        f"[ESCALATION CREATED] ref_id={ref_id} reason={reason} "
        f"urgency={urgency} caller={safe_name}"
    )
    logger.info(f"[ESCALATION SUMMARY] {json.dumps(summary, ensure_ascii=False)}")

    # Step 6 — next-step message to read aloud to the farmer
    urgency_eta = {
        URGENCY_HIGH: "within 2 to 4 hours",
        URGENCY_MEDIUM: "within 24 hours",
        URGENCY_LOW: "within 2 business days",
    }.get(urgency, "as soon as possible")

    next_steps = (
        f"Your request has been logged with reference number {ref_id}. "
        f"A Farm and Field agricultural expert will follow up with you "
        f"{urgency_eta} via your preferred method. "
        f"Please keep this reference number handy."
    )

    return {
        "ref_id": ref_id,
        "status": "created",
        "next_steps": next_steps,
        "summary": summary,
    }


# --------------------------------------------------------------------------- #
# Read helpers (used by dashboard)                                             #
# --------------------------------------------------------------------------- #

def list_escalations(
    status: Optional[str] = None,
    db_path: Optional[Path] = None,
) -> list[Dict[str, Any]]:
    """Return all escalations, optionally filtered by status ('open'/'resolved')."""
    init_escalation_table(db_path)
    conn = _get_conn(db_path)
    try:
        cursor = conn.cursor()
        if status:
            cursor.execute(
                "SELECT * FROM escalations WHERE status = ? ORDER BY created_at DESC",
                (status,),
            )
        else:
            cursor.execute(
                "SELECT * FROM escalations ORDER BY created_at DESC"
            )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def resolve_escalation(
    ref_id: str,
    db_path: Optional[Path] = None,
) -> bool:
    """Mark an escalation as resolved. Returns True if the record was found."""
    init_escalation_table(db_path)
    conn = _get_conn(db_path)
    resolved_at = datetime.now(timezone.utc).isoformat()
    try:
        with conn:
            cur = conn.execute(
                "UPDATE escalations SET status='resolved', resolved_at=? WHERE ref_id=?",
                (resolved_at, ref_id),
            )
            return cur.rowcount > 0
    finally:
        conn.close()
