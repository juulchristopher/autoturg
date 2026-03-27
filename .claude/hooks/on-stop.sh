#!/usr/bin/env bash
# on-stop.sh — Runs when a Claude Code session ends.
# Saves a session checkpoint so the next session can resume from where we left off.
# Triggered by: context window filling up, manual /stop, or session close.

set -euo pipefail

REPO="/home/user/autoturg"
CHECKPOINT="$REPO/.session-checkpoint.md"

cd "$REPO"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "no commits")
DIRTY=$(git status --short 2>/dev/null || echo "")
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M UTC')

cat > "$CHECKPOINT" <<EOF
# Session Checkpoint

**Saved:** $TIMESTAMP
**Branch:** $BRANCH
**Last commit:** $LAST_COMMIT

## Uncommitted changes
\`\`\`
${DIRTY:-none}
\`\`\`

## Resume instructions
The previous session ended (context window limit or manual stop).
On next session start, read this file and continue from the sprint backlog:
- Check \`docs/sprint-backlog.md\` for in-progress tasks
- Run \`git status\` to see any uncommitted work
- Pick up the next pending task and continue

## Sprint backlog snapshot
$(cat "$REPO/docs/sprint-backlog.md" 2>/dev/null | head -60 || echo "not found")
EOF

# Stage and commit the checkpoint if there are changes
if ! git diff --quiet "$CHECKPOINT" 2>/dev/null || ! git ls-files --error-unmatch "$CHECKPOINT" 2>/dev/null; then
  git add "$CHECKPOINT" 2>/dev/null || true
  git commit -m "Save session checkpoint" --no-verify 2>/dev/null || true
fi

# If the usage sentinel is set, record the expected reset time (now + 1 hour)
# and push all work so the next session can resume cleanly.
SENTINEL="/tmp/autoturg-usage-stop"
if [ -f "$SENTINEL" ]; then
  RESET_AT=$(date -u -d '+1 hour' '+%Y-%m-%d %H:%M UTC' 2>/dev/null || date -u -v+1H '+%Y-%m-%d %H:%M UTC' 2>/dev/null || echo "soon")
  echo "$RESET_AT" > /tmp/autoturg-usage-reset-time
  # Try to push checkpoint to remote
  git push -u origin "$BRANCH" 2>/dev/null || true
  echo "{\"systemMessage\": \"Usage limit reached. Checkpoint saved. Session will resume at $RESET_AT.\"}"
else
  echo '{"systemMessage": "Session checkpoint saved to .session-checkpoint.md"}'
fi
