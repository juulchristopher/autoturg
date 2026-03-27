#!/usr/bin/env bash
# on-session-start.sh — Runs when a Claude Code session starts (including web sessions).
# Checks for a session checkpoint and injects resume context.

set -euo pipefail

REPO="/home/user/autoturg"
CHECKPOINT="$REPO/.session-checkpoint.md"

cd "$REPO"

# Install npm deps if node_modules missing (important for web sessions)
if [ ! -d "$REPO/node_modules" ]; then
  npm install --silent 2>/dev/null || true
fi

if [ -f "$CHECKPOINT" ]; then
  SAVED=$(grep '^\*\*Saved:\*\*' "$CHECKPOINT" | head -1 | sed 's/\*\*Saved:\*\* //')
  BRANCH=$(grep '^\*\*Branch:\*\*' "$CHECKPOINT" | head -1 | sed 's/\*\*Branch:\*\* //')
  MSG="Resuming from checkpoint (saved $SAVED on branch $BRANCH). Read .session-checkpoint.md for context."
else
  MSG="Fresh session — no checkpoint found. Check docs/sprint-backlog.md for current tasks."
fi

echo "{\"systemMessage\": \"$MSG\"}"
