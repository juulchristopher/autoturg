#!/usr/bin/env bash
# check-usage.sh — Blocks tool use when plan usage >= 90%.
#
# HOW IT WORKS:
#   Claude Code's plan usage % is only visible in the UI — there is no
#   programmatic API for it. So we use a sentinel file:
#
#   When Claude detects usage >= 90% (via the UI indicator or user message),
#   it writes the sentinel: touch /tmp/autoturg-usage-stop
#
#   This hook fires before every tool call and blocks if the sentinel exists.
#   The on-stop.sh hook saves a checkpoint so the next session can resume.
#
# MANUAL CONTROLS:
#   Pause:  touch /tmp/autoturg-usage-stop
#   Resume: rm /tmp/autoturg-usage-stop

SENTINEL="/tmp/autoturg-usage-stop"
RESET_TIME_FILE="/tmp/autoturg-usage-reset-time"

if [ -f "$SENTINEL" ]; then
  RESET_MSG=""
  if [ -f "$RESET_TIME_FILE" ]; then
    RESET_AT=$(cat "$RESET_TIME_FILE")
    RESET_MSG=" Scheduled to resume at $RESET_AT."
  fi
  printf '{"continue": false, "stopReason": "Plan usage >= 90%%. Work paused and checkpoint saved.%s Remove /tmp/autoturg-usage-stop to resume manually.", "systemMessage": "Usage limit sentinel active — all tool calls blocked.%s"}\n' "$RESET_MSG" "$RESET_MSG"
  exit 0
fi

exit 0
