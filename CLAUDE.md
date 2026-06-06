# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

{{PROJECT_NAME}} build standards — centralized Maven + npm quality configuration shared across all projects.

## Commands

```bash
# Maven
./mvnw clean install          # Build and install all Maven artifacts locally
./mvnw tidy:check             # Verify POM formatting
./mvnw checkstyle:check       # Run Checkstyle
./mvnw spotless:check         # Check Java formatting
./mvnw verify                 # Run all verifications
make ci                       # Full CI: Maven verify + npm install check

# npm (run inside repo-shared-configs/)
yarn install                  # Install dependencies
yarn patch:eslint-config-repo   # Bump patch version of ESLint package
yarn publish:eslint-config-repo # Publish ESLint package to registry
```

## Structure

```
repo-code-quality-configs/   # JAR with Checkstyle and Spotless config files
repo-parent/                 # Maven parent POM (plugin management)
repo-shared-configs/         # Yarn workspace
  packages/
    eslint-config-repo/      # Shareable ESLint + Prettier config
```

## Key Constraints

- Spotless is pinned to **2.30.0** — do not upgrade past 2.43.0 if Java 8 compatibility is required.
- Eclipse formatter is pinned to **4.19.0** for the same reason.
- See USAGE.md for full rationale.

## Token substitution (template bootstrap)

This repo is a template. `repo` is the default org prefix used in module/directory names so the
project loads cleanly in IDEs. Replace it with your actual org name during bootstrapping (e.g.
find-replace `repo-` → `acme-`, `@repo/` → `@acme/`). Other tokens — `{{GROUP_ID}}`,
`{{PROJECT_NAME}}` etc. — are still literal `{{...}}` placeholders; find-replace those too.
