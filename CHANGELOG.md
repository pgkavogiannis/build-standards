# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
