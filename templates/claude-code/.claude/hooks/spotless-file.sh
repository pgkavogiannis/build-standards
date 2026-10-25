#!/usr/bin/env bash
# Claude Code PostToolUse hook: formats the Java file Claude just edited with the project's Spotless configuration.
# Exit 2 sends stderr back to Claude when Spotless itself fails; a missing tool or pom is a silent no-op so editing is
# never blocked. A file that no longer parses is left unchanged (the Eclipse formatter skips it); the compiler reports it.
set -uo pipefail

command -v jq > /dev/null || { echo "spotless-file.sh: jq not installed, skipping format" >&2; exit 0; }
file=$(jq -r '.tool_input.file_path // empty')
[[ "$file" == *.java && -f "$file" ]] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[[ -f pom.xml ]] || exit 0
if [[ -x ./mvnw ]]; then mvn=./mvnw; else mvn=mvn; fi

# spotlessFiles is a comma-separated list of regexes matched against absolute paths; \Q..\E quotes the path literally.
if ! out=$("$mvn" -q -B spotless:apply "-DspotlessFiles=\\Q$file\\E" 2>&1); then
    echo "spotless:apply failed for $file:" >&2
    echo "$out" | grep -E '^\[ERROR\]' | head -20 >&2
    exit 2
fi
