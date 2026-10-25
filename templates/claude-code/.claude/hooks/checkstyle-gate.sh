#!/usr/bin/env bash
# Claude Code Stop hook: keeps Claude from finishing while Java it changed fails spotless:check or checkstyle:check.
# Exit 2 sends the findings back to Claude, which continues and fixes them. Runs only when the working tree has
# changed .java files, and gives up after one retry (stop_hook_active) so it can never loop.
set -uo pipefail

command -v jq > /dev/null || exit 0
[[ "$(jq -r '.stop_hook_active // false')" == "true" ]] && exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[[ -f pom.xml ]] || exit 0
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    [[ -n "$(git status --porcelain -- '*.java')" ]] || exit 0
fi
if [[ -x ./mvnw ]]; then mvn=./mvnw; else mvn=mvn; fi

findings=""
if ! out=$("$mvn" -q -B spotless:check 2>&1); then
    files=$(echo "$out" | grep -E '^\[ERROR\] +\S+\.java$' | sed -E 's/^\[ERROR\] +//')
    [[ -n "$files" ]] && findings+="Not formatted (run ./mvnw spotless:apply):"$'\n'"$files"$'\n'
fi
if ! out=$("$mvn" -q -B checkstyle:check 2>&1); then
    violations=$(echo "$out" | grep -E '^\[ERROR\] .*\.java:\[[0-9]+' | sed -E 's/^\[ERROR\] //' | head -50)
    [[ -n "$violations" ]] && findings+="Checkstyle violations:"$'\n'"$violations"$'\n'
fi

# Build problems that are not findings (no network, broken pom) must not trap Claude: only block on real findings.
[[ -z "$findings" ]] && exit 0
printf 'Fix these before finishing.\n%s' "$findings" >&2
exit 2
