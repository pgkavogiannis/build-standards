# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [1.0.0.0] - {{RELEASE_DATE}}

### Added

- **Maven:** `repo-build-standards` parent module
  - `repo-code-quality-configs`: JAR with Checkstyle and Spotless (Eclipse formatter 4.41) config files and custom Checkstyle checks
    (`BlankLinesInBody`, `UnnecessaryParameterWrap`) with unit tests
  - `repo-parent`: POM with pinned plugin versions and quality gates (Spotless 3.10.4, Checkstyle plugin 3.6.0 with engine 14.3.0,
    Maven Enforcer, OWASP Dependency Check 13.0.0, SonarQube, JaCoCo)
  - Maven Wrapper 3.3.4 (Maven 3.10.0, SHA-256 pinned); JDK 21 (`.sdkmanrc`); the `jdk-8` branch is the Java 8 line
- **npm:** `@repo/eslint-config-repo`, a shareable ESLint 10 flat config and Prettier config for Angular (typescript-eslint 8,
  angular-eslint 22) with tests; Yarn 4.18.1 workspace with `enableScripts: false` and `npmMinimalAgeGate: 7d`
- **Bootstrap:** `scripts/init.mjs` (with tests) renames `repo-*` to your prefix and fills the template tokens
- **Dependencies and secrets:** `renovate.json` (7-day `minimumReleaseAge`) and a `.gitleaks.toml` that extends the default rules
- **Docs:** README, USAGE, CONTRIBUTING, SECURITY, IDE-SETUP and `THIRD_PARTY_NOTICES.md` (vendored Everything Claude Code Java rules, MIT)
- **Claude Code:** project `CLAUDE.md`, Java rules in `.claude/rules/java/`, hooks template in `templates/claude-code/`
- **Samples:** `samples/formatting-sample` and `samples/try-on-project.sh` for trying the Spotless and Checkstyle config
