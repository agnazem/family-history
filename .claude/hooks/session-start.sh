#!/bin/bash
set -euo pipefail

# Only run in remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SKILLS_DIR="$HOME/.claude/skills"
GSTACK_DIR="$SKILLS_DIR/gstack"

# Clone or update gstack
if [ -d "$GSTACK_DIR/.git" ]; then
  git -C "$GSTACK_DIR" pull --ff-only --quiet
else
  mkdir -p "$SKILLS_DIR"
  git clone --quiet https://github.com/garrytan/gstack.git "$GSTACK_DIR"
fi

# Symlink each gstack skill directly into ~/.claude/skills/ so they're
# discoverable as individual slash commands
for skill_dir in "$GSTACK_DIR"/*/; do
  skill_name=$(basename "$skill_dir")
  if [ -f "$skill_dir/SKILL.md" ] && [ ! -e "$SKILLS_DIR/$skill_name" ]; then
    ln -s "$skill_dir" "$SKILLS_DIR/$skill_name"
  fi
done
