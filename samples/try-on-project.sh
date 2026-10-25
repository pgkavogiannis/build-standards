#!/usr/bin/env bash
# Runs this repo's Spotless + Checkstyle configuration against a real third-party Maven project, in a temp dir.
# Nothing in this repo or in the target project's clone is modified; the target's pom is patched in a throwaway copy.
#
# Usage: samples/try-on-project.sh [apply] [-- <git-url> <git-sha-or-tag>]
#   (no args)   spotless:check + checkstyle:check on the default project (jsoup, pinned commit), with a summary
#   apply       also run spotless:apply and print how much it would change (git diff --stat)
#   -- URL REF  use another single-module Maven project instead (REF must be a commit SHA or tag)
# Env: MVN=<maven command>   (default: ./mvnw from the repo root, falls back to mvn)
#      KEEP=1                keep the temp dir (path is printed) so you can inspect/diff the result
#
# Plugin versions and the Eclipse/Checkstyle config files come from repo-parent and repo-code-quality-configs on the
# CURRENT branch, so jdk-8 / main checkouts are each tested with their own pinned Spotless + formatter.
# The custom Checkstyle checks in repo-code-quality-configs are built from a copy of this repo and installed into ~/.m2
# as <groupId of the root pom>:repo-code-quality-configs, like samples/formatting-sample/try-it.sh does.
# Note: this runs the target project's own Maven build config (its pom's plugins), so only point it at projects you trust.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
res="$repo_root/repo-code-quality-configs/src/main/resources"
parent_pom="$repo_root/repo-parent/pom.xml"
group_id="$(sed -n 's|^    <groupId>\(.*\)</groupId>|\1|p' "$repo_root/pom.xml" | head -1)"   # the project's own groupId

apply=0
if [[ "${1:-}" == "apply" ]]; then apply=1; shift; fi
url="https://github.com/jhy/jsoup"
ref="0c508f17a52d294aa846f4cbca312b2e65e9f94f"
[[ "${1:-}" == "--" ]] && { url="${2:?usage: -- <git-url> <ref>}"; ref="${3:?usage: -- <git-url> <ref>}"; }

prop() { sed -n "s|.*<$1>\(.*\)</$1>.*|\1|p" "$parent_pom" | head -1; }
spotless_v="$(prop spotless-maven-plugin.version)"
eclipse_v="$(prop eclipse-style.version)"
checkstyle_v="$(prop maven-checkstyle-plugin.version)"
checkstyle_engine_v="$(prop checkstyle.version)"   # empty on lines that use the plugin's bundled engine
configs_v="$(prop repo-code-quality-configs.version)"

if [[ -n "${MVN:-}" ]]; then mvn_cmd="$MVN"; elif [[ -x "$repo_root/mvnw" ]]; then mvn_cmd="$repo_root/mvnw"; else mvn_cmd=mvn; fi
mvn_cmd="$mvn_cmd -B -ntp"

work="$(mktemp -d)"
if [[ "${KEEP:-0}" == "1" ]]; then echo ">> KEEP=1: work dir is $work"; else trap 'rm -rf "$work"' EXIT; fi
proj="$work/project"

echo ">> Building custom Checkstyle checks (repo-code-quality-configs $configs_v, groupId $group_id)"
standards="$work/standards"
mkdir "$standards"
(cd "$repo_root" && git ls-files -co --exclude-standard -z | grep -zv node_modules | tar --null -T - -cf -) | tar -xf - -C "$standards"
$mvn_cmd -q -f "$standards/pom.xml" -DskipTests -pl repo-code-quality-configs -am install

echo ">> Fetching $url @ $ref (shallow)"
mkdir "$proj" && git -C "$proj" init -q && git -C "$proj" fetch -q --depth 1 "$url" "$ref" && git -C "$proj" checkout -q FETCH_HEAD

snippet="$work/plugins.xml"
checkstyle_deps="<dependency><groupId>$group_id</groupId><artifactId>repo-code-quality-configs</artifactId><version>$configs_v</version></dependency>"
if [[ -n "$checkstyle_engine_v" ]]; then
  checkstyle_deps="$checkstyle_deps<dependency><groupId>com.puppycrawl.tools</groupId><artifactId>checkstyle</artifactId><version>$checkstyle_engine_v</version></dependency>"
fi
cat > "$snippet" <<XML
      <plugin>
        <groupId>com.diffplug.spotless</groupId>
        <artifactId>spotless-maven-plugin</artifactId>
        <version>$spotless_v</version>
        <configuration>
          <java>
            <eclipse>
              <file>$res/repo_java_style.xml</file>
              <version>$eclipse_v</version>
            </eclipse>
            <trimTrailingWhitespace/>
          </java>
        </configuration>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-checkstyle-plugin</artifactId>
        <version>$checkstyle_v</version>
        <dependencies>$checkstyle_deps</dependencies>
        <configuration>
          <configLocation>$res/checkstyle.xml</configLocation>
          <suppressionsLocation>$res/suppressions.xml</suppressionsLocation>
          <consoleOutput>true</consoleOutput>
          <includeTestSourceDirectory>true</includeTestSourceDirectory>
        </configuration>
      </plugin>
XML

# Insert the plugins right after the first <plugins> that follows the first <build> (the non-profile build).
awk -v snippet="$snippet" '
  /<build>/ && !inbuild { inbuild = 1 }
  { print }
  inbuild && !done && /<plugins>/ { while ((getline line < snippet) > 0) print line; done = 1 }
  END { if (!done) { print "try-on-project: no <build><plugins> found in pom.xml" > "/dev/stderr"; exit 1 } }
' "$proj/pom.xml" > "$proj/pom.xml.new" && mv "$proj/pom.xml.new" "$proj/pom.xml"
git -C "$proj" add -A >/dev/null && git -C "$proj" -c user.email=t@t -c user.name=t commit -qm baseline

echo ">> Spotless $spotless_v / Eclipse formatter $eclipse_v / Checkstyle plugin $checkstyle_v (engine ${checkstyle_engine_v:-plugin default})"
java_files="$(git -C "$proj" ls-files '*.java' | wc -l | tr -d ' ')"

echo; echo ">> spotless:check"
$mvn_cmd -f "$proj/pom.xml" spotless:check > "$work/spotless.log" 2>&1 && echo "   PASS" || echo "   FAIL (see 'apply' for the full impact)"

echo; echo ">> checkstyle:check"
$mvn_cmd -f "$proj/pom.xml" checkstyle:check > "$work/checkstyle.log" 2>&1 && echo "   PASS" || echo "   FAIL: $(grep -o 'You have [0-9]* Checkstyle violations' "$work/checkstyle.log" | head -1)"
echo "   violations by rule:"
grep -oE '^\[(ERROR|WARN|WARNING)\] .*\] \([a-z]+\) [A-Za-z]+' "$work/checkstyle.log" \
  | sed -E 's/^\[(ERROR|WARN|WARNING)\].*\] \(([a-z]+)\) ([A-Za-z]+)$/\1 (\2) \3/; s/^WARN /WARNING /' \
  | sort | uniq -c | sort -rn | sed 's/^/     /'
echo "   warnings by rule (reported, not build-failing):"
grep -oE '^\[WARN(ING)?\] .*\[[A-Za-z]+\]$' "$work/checkstyle.log" | grep -oE '\[[A-Za-z]+\]$' | tr -d '[]' \
  | sort | uniq -c | sort -rn | sed 's/^/     /'

if [[ $apply -eq 1 ]]; then
  echo; echo ">> spotless:apply"
  $mvn_cmd -f "$proj/pom.xml" -q spotless:apply > "$work/apply.log" 2>&1 || { tail -20 "$work/apply.log"; exit 1; }
  changed="$(git -C "$proj" diff --name-only | wc -l | tr -d ' ')"
  echo "   $changed of $java_files Java files would change:"
  git -C "$proj" diff --shortstat | sed 's/^/   /'
  if [[ "${KEEP:-0}" == "1" ]]; then
    # Commit Spotless's output so that any hand edits made afterwards show up alone in 'git diff':
    # that diff is exactly where the current profile differs from the style you want.
    git -C "$proj" add -A >/dev/null && git -C "$proj" -c user.email=t@t -c user.name=t commit -qm "spotless-applied"
    echo
    echo ">> Project kept at: $proj"
    echo "   1. Edit files there by hand (IDE or editor) into the style you want. Do NOT re-run spotless:apply."
    echo "   2. Capture your edits:   git -C $proj diff > style-feedback.patch"
    echo "      (or just 'git -C $proj diff --stat' / 'git -C $proj diff -- <file>' to look at them)"
  fi
fi
