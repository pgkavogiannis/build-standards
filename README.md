# repo-build-standards

A configs-only template for bootstrapping shared Java/Maven + Angular/npm build standards across your organization.

## What's included

| Path                         | Purpose                                                            |
|------------------------------|--------------------------------------------------------------------|
| `repo-code-quality-configs/` | JAR with Checkstyle/Spotless config files and custom Checkstyle checks |
| `repo-parent/`               | Maven parent POM with pinned plugin versions and quality gates     |
| `repo-shared-configs/`       | Yarn workspace with a shareable ESLint + Prettier config package   |
| `Makefile`                   | Platform-agnostic CI entry point (`make ci`)                       |
| `scripts/`                   | `init.mjs` bootstrap script and its tests (removed by `init.mjs`)  |
| `renovate.json`              | Renovate config: dependency updates with a 7-day minimum release age |
| `mvnw` / `mvnw.cmd`          | Maven Wrapper 3.3.4, script-only (Maven 3.10.0, SHA-256 pinned)    |
| `CLAUDE.md`                  | Claude Code project instructions starter                           |
| `CONTRIBUTING.md`            | Dev setup, pre-commit hooks, release process                       |
| `SECURITY.md`                | Vulnerability disclosure policy                                    |
| `THIRD_PARTY_NOTICES.md`     | Attribution and license text for vendored third-party files         |
| `.editorconfig`              | Editor-agnostic indent/charset/line-length (160) rules              |
| `IDE-SETUP.md`               | IntelliJ and Claude Code setup for the shared Java style            |
| `templates/claude-code/`     | Claude Code hooks + CLAUDE.md section for consuming projects        |
| `.gitattributes`             | Enforces LF line endings and binary markers across all Git clients |
| `.sdkmanrc`                  | Pins JDK version (Java 21 Temurin) for sdkman users                |
| `.gitleaks.toml`             | gitleaks config: built-in rules plus an allowlist for template tokens |
| `.env.example`               | Documents required secrets — safe to commit                        |
| `.husky/pre-commit`          | Git hook: runs `tidy:check` on every commit                        |

### Key tooling versions

| Tool                   | Version | Notes                                                       |
|------------------------|---------|-------------------------------------------------------------|
| Maven (wrapper)        | 3.10.0  | Building this repo needs 3.9.4+ (gitflow-maven-plugin)      |
| Spotless Maven Plugin  | 3.10.4  | Requires Java 17+; supports Java 21 language features       |
| Eclipse Java Formatter | 4.41    | Bundled default for Spotless 3.10.4                         |
| Checkstyle (engine)    | 14.3.0  | Overrides bundled 9.3, which cannot parse Java 21           |

See `USAGE.md` for the rationale behind non-obvious choices and `IDE-SETUP.md` for IntelliJ and Claude Code setup.

## Prerequisites

- Java 21+ (enforced by Maven Enforcer)
- Maven 3.9.4+ (or use the included `./mvnw`); projects inheriting `repo-parent` need 3.6.3+ (enforced)
- Node.js 24 (`repo-shared-configs/package.json` pins 24.16.0 for [Volta](https://volta.sh/)); `scripts/init.mjs` needs 20+
- Yarn 4.18.1 through Corepack (`corepack enable`) or Volta; `repo-shared-configs/.yarnrc.yml` disables dependency install
  scripts and only installs versions published at least 7 days ago

## Bootstrap

1. Clone this repo (or unpack the archive) into your new project directory. Use a fresh checkout: no `target/` directories.

2. Run the init script (Node.js 20+; no dependencies). It renames `repo-*` to `<prefix>-*`, fills the tokens and
   defaults below, then deletes `scripts/` and the `init-test` Makefile target, which only work on the untouched template:

   ```sh
   node scripts/init.mjs --prefix acme --group-id com.acme --name "Acme Build Standards" --author "Acme Inc."
   ```

   | Option                     | Fills                                                                                  | Default                |
   |----------------------------|----------------------------------------------------------------------------------------|------------------------|
   | `--prefix` (required)      | Module, directory and package names: `repo-parent` → `acme-parent`, `@repo/` → `@acme/` | -                      |
   | `--group-id` (required)    | Maven `groupId` (`com.example` in the template)                                         | -                      |
   | `--name` (required)        | Human-readable project name used in POM names and package descriptions                 | -                      |
   | `--author` (required)      | Copyright holder in `LICENSE` (`John Doe` in the template)                              | -                      |
   | `--year`                   | Copyright year                                                                         | current year           |
   | `--license`                | SPDX id in `package.json` and below; replace the `LICENSE` text yourself if not MIT    | `MIT`                  |
   | `--component-prefix`       | Angular selector prefix                                                                | the `--prefix` value   |
   | `--release-date`           | Date of the first `CHANGELOG.md` release                                               | today                  |
   | `--maven-distribution-url` | Internal Maven distribution URL in `.mvn/wrapper/maven-wrapper.properties`            | left as is             |
   | `--plugin-group-id`        | Custom plugin groupId to exclude from site reports                                     | exclusion removed      |
   | `--dry-run`                | Print what would change and write nothing                                             |                        |
   | `--keep-scripts`           | Keep `scripts/` and the `init-test` target                                             |                        |

   `{{NVD_API_KEY}}`, `{{OSS_INDEX_USERNAME}}` and `{{OSS_INDEX_PASSWORD}}` in `repo-parent/pom.xml` stay as placeholders
   on purpose: credentials belong in your own `settings.xml` or CI secrets, never in a committed POM.

3. Build and check:
   ```sh
   ./mvnw clean install
   cd acme-shared-configs && yarn install --immutable
   ```

4. Review `SECURITY.md` (private reporting channel of your platform) and the `LICENSE` holder, then commit.

## Usage in child projects

### Java/Maven

```xml
<parent>
    <groupId>com.example</groupId>
    <artifactId>repo-parent</artifactId>
    <version>1.0.0.0</version>
</parent>
```

Enable quality checks in your module:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-checkstyle-plugin</artifactId>
        </plugin>
        <plugin>
            <groupId>com.diffplug.spotless</groupId>
            <artifactId>spotless-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

Run quality checks:

```sh
./mvnw tidy:check
./mvnw checkstyle:check
./mvnw spotless:check
./mvnw verify -Pjacoco
./mvnw sonar:sonar
```

### Angular / npm

Install the package and its peer dependencies (ESLint 10 flat config; ESLint needs Node ^20.19, ^22.13 or 24+, typescript-eslint 8 needs
TypeScript below 6.1, angular-eslint 22 matches Angular 22):

```sh
yarn add --dev @repo/eslint-config-repo eslint @eslint/js typescript-eslint angular-eslint eslint-config-prettier prettier
```

Configure ESLint (`eslint.config.js`). The config finds each file's `tsconfig.json` itself (`parserOptions.projectService`):

```js
module.exports = require('@repo/eslint-config-repo');
```

To extend it, spread it into your own array, for example to pin the tsconfig root in a monorepo:

```js
const repo = require('@repo/eslint-config-repo');

module.exports = [...repo, { files: ['**/*.ts'], languageOptions: { parserOptions: { tsconfigRootDir: __dirname } } }];
```

## Versioning

All Maven artifacts use a 4-digit version: `MAJOR.MINOR.PATCH.BUILD`

```sh
# Bump Maven version
./mvnw versions:set -DnewVersion=1.1.0.0

# Bump npm version
cd repo-shared-configs
yarn patch:eslint-config-repo
```

## License

{{LICENSE}} — See LICENSE file for details.
