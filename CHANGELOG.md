# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed

- **Maven:** Maven Wrapper moved from takari 0.5.6 to Apache Maven Wrapper 3.3.4 (`only-script`, no
  `maven-wrapper.jar`); Maven stays on 3.9.11 with the distribution SHA-256 pinned
- **Java style:** `repo_java_style.xml` ported from the JDK 21 line: type-use annotations stay inline on parameters,
  one-line method bodies are preserved (`{ return x; }`), continuation indent +4 (was +8) without column alignment,
  binary operators wrap where necessary at 160 columns, no forced blank line after a type header; Spotless now
  trims trailing whitespace. Eclipse 4.19.0 formats the jsoup test project byte-for-byte like 4.41 on `main`
- **Checkstyle:** added `NeedBraces` and `DeclarationOrder` (static fields, fields, constructors, methods;
  public→protected→package→private within field groups)
- **Checkstyle:** custom checks shipped in `repo-code-quality-configs` (`buildstandards.checkstyle`):
  `BlankLinesInBody` (blank lines in bodies with more than 4 statements/members) and `UnnecessaryParameterWrap`
  (wrapped parameter lists that fit in 160 columns); `FinalLocalVariable` as a warning
- **Maven:** `repo-code-quality-configs` now compiles Java (source/target 1.8, against Checkstyle 9.3) and runs its
  unit tests (JUnit 5.14.4); `repo-parent` pins the Checkstyle engine to 9.3 via `checkstyle.version`
- **Editor:** `.editorconfig` `max_line_length` 140 → 160 to match the formatter and Prettier

### Added

- **Samples:** `samples/formatting-sample` (deliberately mis-formatted project with `try-it.sh`) and
  `samples/try-on-project.sh` (runs the Spotless + Checkstyle config against a pinned jsoup commit in a temp dir)
- **Docs:** `IDE-SETUP.md` (IntelliJ + Claude Code); `templates/claude-code/` with a PostToolUse Spotless hook and a
  Stop hook that blocks on `spotless:check` / `checkstyle:check` findings
- **Claude Code:** removed `.claudeignore`, which Claude Code does not read; file access is restricted by
  `permissions.deny` in `.claude/settings.json`, and search skips `.gitignore`d paths. Junk-file patterns from it
  (compiled classes, editor/OS files, logs, coverage, temp files) moved to `.gitignore`

## [1.0.0.0] - {{RELEASE_DATE}}

### Added

- Initial release of `repo-build-standards` template
- **Maven:** `repo-build-standards` parent module
  - **Maven:** `repo-code-quality-configs` JAR with Checkstyle and Spotless config files
  - **Maven:** `repo-parent` POM with pinned plugin versions
    - Spotless Maven Plugin 2.30.0 (Java 8 compatible)
    - Checkstyle Plugin 3.6.0
    - Tidy Maven Plugin 1.4.0
    - SonarQube Maven Plugin 5.2.0.4988
    - Maven Enforcer Plugin 3.5.0
    - OWASP Dependency Check 12.1.3
  - Maven Wrapper 3.9.11
- **npm:** `@repo/eslint-config-repo` shareable ESLint + Prettier config
- **Git:** `.gitattributes` enforcing LF line endings, binary markers, and `export-ignore` for dev meta files
- **Toolchain:** `.sdkmanrc` pinning JDK 8.0.422-tem (Eclipse Temurin) to match `maven.compiler.source/target = 1.8`
- **Git:** `.gitattributes` enforcing LF line endings, binary markers, and `export-ignore` for dev meta files
- **Toolchain:** `.sdkmanrc` pinning JDK 8.0.422-tem (Eclipse Temurin) to match `maven.compiler.source/target = 1.8`
