#!/usr/bin/env python3
"""
rate_limit_guard.py — Token limit protection for GitHub Actions agents.

Writes .agent_paused with a reset_at timestamp when the session is close
to the 5-hour rolling window limit. Called at the start of each agent run.

Usage:
    python3 scripts/rate_limit_guard.py

Exit codes:
    0 — safe to proceed
    1 — paused, caller should exit gracefully

.agent_session format:   {"started_at": "2026-03-29T08:00:00Z"}
.agent_paused  format:   {"paused_at": "...", "reset_at": "...", "reason": "..."}
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

SESSION_FILE = Path(".agent_session")
PAUSED_FILE = Path(".agent_paused")

# Stop at 90% of the 5-hour window = 4.5 hours
SESSION_WINDOW_HOURS = 5.0
STOP_AT_HOURS = SESSION_WINDOW_HOURS * 0.9  # 4.5 hours


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def load_session_start() -> datetime | None:
    if not SESSION_FILE.exists():
        return None
    try:
        data = json.loads(SESSION_FILE.read_text())
        return datetime.fromisoformat(data["started_at"].replace("Z", "+00:00"))
    except Exception:
        return None


def write_session_start() -> datetime:
    now = utcnow()
    SESSION_FILE.write_text(json.dumps({"started_at": now.isoformat()}))
    return now


def write_pause(reason: str, reset_at: datetime) -> None:
    PAUSED_FILE.write_text(json.dumps({
        "paused_at": utcnow().isoformat(),
        "reset_at": reset_at.isoformat(),
        "reason": reason,
    }, indent=2))


def main() -> int:
    # If already paused, respect it
    if PAUSED_FILE.exists():
        try:
            data = json.loads(PAUSED_FILE.read_text())
            reset_at_str = data.get("reset_at", "")
            if reset_at_str:
                reset_at = datetime.fromisoformat(reset_at_str.replace("Z", "+00:00"))
                if utcnow() < reset_at:
                    mins_left = int((reset_at - utcnow()).total_seconds() / 60)
                    print(f"[rate_limit_guard] Agent still paused. Resume in ~{mins_left} minutes.")
                    return 1
                else:
                    # Reset time has passed — clear flag and proceed
                    PAUSED_FILE.unlink(missing_ok=True)
                    SESSION_FILE.unlink(missing_ok=True)
                    print("[rate_limit_guard] Pause period ended — proceeding.")
        except Exception:
            PAUSED_FILE.unlink(missing_ok=True)

    # Load or create session start
    session_start = load_session_start()
    if session_start is None:
        session_start = write_session_start()
        print(f"[rate_limit_guard] New session started at {session_start.isoformat()}")

    # Calculate elapsed time
    elapsed = utcnow() - session_start
    elapsed_hours = elapsed.total_seconds() / 3600

    print(f"[rate_limit_guard] Session elapsed: {elapsed_hours:.2f}h / {SESSION_WINDOW_HOURS}h")

    if elapsed_hours >= STOP_AT_HOURS:
        # Estimate reset: session start + 5 hours
        reset_at = session_start + timedelta(hours=SESSION_WINDOW_HOURS)
        write_pause(
            reason=f"Session elapsed {elapsed_hours:.2f}h >= {STOP_AT_HOURS}h limit",
            reset_at=reset_at,
        )
        print(f"[rate_limit_guard] PAUSED. Estimated reset at {reset_at.isoformat()}")
        return 1

    remaining = STOP_AT_HOURS - elapsed_hours
    print(f"[rate_limit_guard] {remaining:.2f}h remaining before pause threshold.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
