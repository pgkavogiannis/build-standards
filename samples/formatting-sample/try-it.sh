#!/usr/bin/env bash
# Runs the formatting sample against the shared configs without touching this working tree.
# The repo is copied to a temp dir and the checks run in that copy, so no target/ directories land in the working tree.
#
# Usage: samples/formatting-sample/try-it.sh [apply]
#   (no arg)  install shared configs, then show what spotless:check and checkstyle:check report
#   apply     additionally run spotless:apply in the copy and print the resulting diff
# Env: MVN=<maven command> (default: ./mvnw from the repo root, falls back to mvn)
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

if [[ -n "${MVN:-}" ]]; then mvn_cmd="$MVN"; elif [[ -x "$repo_root/mvnw" ]]; then mvn_cmd="$repo_root/mvnw"; else mvn_cmd=mvn; fi
mvn_cmd="$mvn_cmd -B -ntp"

(cd "$repo_root" && git ls-files -co --exclude-standard -z | grep -zv node_modules | tar --null -T - -cf -) | tar -xf - -C "$work"

echo ">> Installing shared configs and parent POM into the local repo (~/.m2)"
(cd "$work" && $mvn_cmd -q -DskipTests -pl repo-code-quality-configs,repo-parent -am install)

sample="$work/samples/formatting-sample"
cp -r "$sample/src" "$work/src-before"

echo; echo ">> spotless:check (expect FAILURE: MessyOrderService, StyleViolations)"
(cd "$sample" && $mvn_cmd spotless:check) || true

echo; echo ">> checkstyle:check (expect FAILURE: 19 violations + 1 warning, all in StyleViolations)"
(cd "$sample" && $mvn_cmd checkstyle:check) || true

if [[ "${1:-}" == "apply" ]]; then
  echo; echo ">> spotless:apply, then diff of what changed"
  (cd "$sample" && $mvn_cmd -q spotless:apply)
  diff -ru "$work/src-before" "$sample/src" || true
fi
