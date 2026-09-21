#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash) — second layer behind the `permissions.ask`
# rules in .claude/settings.json. Enforces the Human gates from CONTEXT.md:
# a Dev Agent must never commit, push, open issues/PRs, merge, touch
# deploys/secrets, or discard work without Alison's explicit go-ahead.
#
# The permission rules match on a command's prefix; this catches the same
# commands when they're chained (`a && git push`), nested (`bash -c "git
# commit"`) or prefixed (`git -C dir commit`), where a prefix rule can miss.
# It only ever answers "ask" — it never denies, and never approves. A quoted
# word that looks like a command (`echo "docker"`) therefore costs one extra
# confirmation at worst; that's the price of also catching `bash -c "docker …"`.

set -euo pipefail

command=$(jq -r '.tool_input.command // empty')
[ -n "$command" ] || exit 0

# A command starts at the beginning of the line or right after ; & | ( $( ` or
# a quote (for `bash -c "..."`), optionally behind sudo.
start='(^|[;&|(`"'"'"']|\$\()[[:space:]]*(sudo[[:space:]]+)?'
# `git [-C dir] [-c k=v] <subcommand>`: skip global options and their values.
git_prefix="${start}git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+"
end='([[:space:]]|$|;|&|\||"|'"'"')'

reason=""

if grep -Eq "${git_prefix}(commit|push|reset|restore|clean|rebase|merge|cherry-pick|am|apply|revert)${end}" <<<"$command" ||
   grep -Eq "${git_prefix}checkout[[:space:]]+(-f|--force|--)${end}" <<<"$command" ||
   grep -Eq "${git_prefix}branch[[:space:]]+-D${end}" <<<"$command" ||
   { grep -Eq "${git_prefix}stash${end}" <<<"$command" &&
     ! grep -Eq "${git_prefix}stash[[:space:]]+(list|show)${end}" <<<"$command"; }; then
  reason="git command that commits, publishes, or discards work"
elif grep -Eq "${start}gh[[:space:]]+(pr|issue)[[:space:]]+(create|merge|edit|comment|close|reopen|review|ready|lock|delete)${end}" <<<"$command" ||
     grep -Eq "${start}gh[[:space:]]+(api|release|workflow|secret|variable|repo|run)${end}" <<<"$command"; then
  reason="GitHub write (issue/PR/workflow/secret/repo)"
elif grep -Eq "${start}(ssh|scp|rsync|docker|docker-compose|kubectl)${end}" <<<"$command"; then
  reason="deploy/infrastructure command"
elif grep -Eq "(^|[[:space:]/=\"'])\.env(rc)?(${end})" <<<"$command"; then
  reason="reads a secrets file (.env / .envrc)"
fi

[ -n "$reason" ] || exit 0

jq -n --arg reason "Human gate (CONTEXT.md): $reason. Needs Alison's explicit OK." '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
