# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

{{PROJECT_NAME}} build standards — centralized Maven + npm quality configuration shared across all projects.

## Commands

```bash
# Maven
./mvnw clean install          # Build and install all Maven artifacts locally
./mvnw tidy:check             # Verify POM formatting
./mvnw verify                 # Compile and test the custom Checkstyle checks
make ci                       # Full CI: tidy:check + verify, yarn install --immutable + format:check + config tests, init tests
git config core.hooksPath .husky   # One-time: activate pre-commit hook (runs tidy:check)

# npm (run inside repo-shared-configs/)
yarn install                  # Install dependencies
yarn test                     # Lint TS + Angular fixtures with the shared ESLint config
yarn patch:eslint-config-repo   # Bump patch version of ESLint package
yarn publish:eslint-config-repo # Publish ESLint package to registry
```

## Structure

```
repo-code-quality-configs/   # JAR with Checkstyle and Spotless config files + custom Checkstyle checks (buildstandards.checkstyle, with tests)
repo-parent/                 # Maven parent POM (plugin management)
repo-shared-configs/         # Yarn workspace
  packages/
    eslint-config-repo/      # Shareable ESLint + Prettier config
samples/formatting-sample/   # Deliberately mis-formatted Java project for testing Spotless/Checkstyle (not in reactor; see its README)
samples/try-on-project.sh    # Runs the Spotless/Checkstyle config against a real project (jsoup, pinned) in a temp dir
templates/claude-code/       # Claude Code hooks + CLAUDE.md section to copy into consuming projects (see IDE-SETUP.md)
.claude/plan/                # Dated plans (e.g. the IDE & Claude Code setup plan)
.claude/rules/java/          # Claude Code Java rules (coding style, patterns, security, testing, hooks)
```

## Key Constraints

- The root reactor declares neither Spotless nor Checkstyle (only consumers of `repo-parent` run them), so `spotless:check` and
  `checkstyle:check` do not work here; `samples/formatting-sample/try-it.sh` exercises them.
- Requires **JDK 21+** — enforced by the Maven Enforcer plugin.
- Spotless **3.x** requires Java 17+; do not downgrade to 2.x on this branch.
- Eclipse formatter **4.41** matches Spotless 3.10.4 defaults; bumping it changes formatting output.
- Checkstyle engine **14.3.0** is pinned via `checkstyle.version`; the plugin's bundled 9.3 cannot parse Java 21.
- Building this repo needs Maven **3.9.4+** (gitflow-maven-plugin); use `./mvnw` (Maven 3.10.0).
- Custom checks compile against the Checkstyle engine pinned in `repo-code-quality-configs/pom.xml`; keep it equal to `checkstyle.version` in repo-parent.
- See USAGE.md for full rationale.

## Token substitution (template bootstrap)

This repo is a template. `repo` is the default prefix used in module/directory names so the project loads cleanly in IDEs,
and `com.example` / `John Doe` are the default groupId and license holder. `node scripts/init.mjs --help` replaces them and
fills the remaining `{{...}}` tokens (it deletes itself afterwards); `make init-test` tests it against the real template files.
`{{NVD_API_KEY}}`, `{{OSS_INDEX_USERNAME}}` and `{{OSS_INDEX_PASSWORD}}` stay as placeholders: set them per user, not in the POM.
When you add a new placeholder token, teach `scripts/init.mjs` to fill it (or list it in `KEPT_TOKENS`); the test fails otherwise.
