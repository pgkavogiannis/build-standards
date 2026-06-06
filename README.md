# repo-build-standards

A configs-only template for bootstrapping shared Java/Maven + Angular/npm build standards across your organization.

## What's included

| Path | Purpose |
|---|---|
| `repo-code-quality-configs/` | JAR artifact with Checkstyle and Spotless formatter config files |
| `repo-parent/` | Maven parent POM with pinned plugin versions and quality gates |
| `repo-shared-configs/` | Yarn workspace with a shareable ESLint + Prettier config package |
| `Makefile` | Platform-agnostic CI entry point (`make ci`) |
| `mvnw` / `mvnw.cmd` | Maven wrapper (Maven 3.9.11) |
| `CLAUDE.md` | Claude Code project instructions starter |
| `CONTRIBUTING.md` | Dev setup, pre-commit hooks, release process |
| `SECURITY.md` | Vulnerability disclosure policy |
| `.editorconfig` | Editor-agnostic indent/charset rules |
| `.gitattributes` | Enforces LF line endings and binary markers across all Git clients |
| `.sdkmanrc` | Pins JDK version (Java 8 Temurin) for sdkman users |
| `.gitleaks.toml` | Secret scanning allowlist (wrapper JAR, template tokens) |
| `.claudeignore` | Claude Code ignore patterns |
| `.env.example` | Documents required secrets — safe to commit |
| `.husky/pre-commit` | Git hook: runs `tidy:check` on every commit |

### Key tooling versions (pinned for Java 8 compatibility)

| Tool | Version | Why pinned |
|---|---|---|
| Spotless Maven Plugin | 2.30.0 | 2.46.0+ requires Java 11+ |
| Eclipse Java Formatter | 4.19.0 | 4.20+ requires Java 11+ |

See `USAGE.md` for the rationale behind non-obvious choices.

## Prerequisites

- Java 8+
- Maven 3.6.3+ (or use the included `./mvnw`)
- Node.js 20+ with [Volta](https://volta.sh/) for version pinning
- Yarn 4+

## Bootstrap

1. Clone this repo into your new project directory.

2. Find-replace `repo` with your org prefix (e.g. `acme`) in source files:
   ```sh
   grep -rl 'repo' . --include='*.xml' --include='*.json' --include='*.js' --include='*.md' \
     | xargs sed -i 's/repo-/acme-/g; s/@repo\//@acme\//g'
   ```

3. Find-replace the remaining `{{...}}` tokens:

   | Token | Replace with |
   |---|---|
   | `{{GROUP_ID}}` | Your Maven group ID, e.g. `com.example` |
   | `{{PROJECT_NAME}}` | Human-readable project name, e.g. `Acme Build Standards` |
   | `{{NVD_API_KEY}}` | API key from https://nvd.nist.gov/developers/request-an-api-key |
   | `{{OSS_INDEX_USERNAME}}` | OSS Index account email from https://ossindex.sonatype.org/ |
   | `{{OSS_INDEX_PASSWORD}}` | OSS Index API token |
   | `{{COMPONENT_PREFIX}}` | Angular component/directive selector prefix, e.g. `app` |
   | `{{CUSTOM_PLUGIN_GROUP_ID}}` | Custom Maven plugin groupId to exclude from site reports, or remove the `<pluginManagementExcludes>` element |
   | `{{YEAR}}` | Current year |
   | `{{AUTHOR}}` | Your name or organization |
   | `{{LICENSE}}` | SPDX license identifier, e.g. `MIT` or `Apache-2.0` |
   | `{{MAVEN_DISTRIBUTION_URL}}` | _(Optional)_ Custom Artifactory URL for Maven distribution |
   | `{{SECURITY_EMAIL}}` | Email address for vulnerability reports (SECURITY.md) |
   | `{{RELEASE_DATE}}` | Initial release date for CHANGELOG.md |

4. Rename directories from `repo-*` to your prefix:
   ```sh
   # Example for prefix "acme":
   mv repo-parent acme-parent
   mv repo-code-quality-configs acme-code-quality-configs
   mv repo-shared-configs acme-shared-configs
   mv acme-code-quality-configs/src/main/resources/repo_java_style.xml \
      acme-code-quality-configs/src/main/resources/acme_java_style.xml
   mv acme-shared-configs/packages/eslint-config-repo \
      acme-shared-configs/packages/eslint-config-acme
   ```

5. Build Maven artifacts:
   ```sh
   ./mvnw clean install
   ```

6. Install npm packages:
   ```sh
   cd repo-shared-configs
   yarn install
   ```

## Usage in child projects

### Java/Maven

```xml
<parent>
    <groupId>{{GROUP_ID}}</groupId>
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

Install the package:

```sh
yarn add --dev @repo/eslint-config-repo
```

Configure ESLint (`.eslintrc.json`):

```json
{
    "root": false,
    "extends": ["@repo/eslint-config-repo"],
    "overrides": [
        {
            "files": ["*.ts"],
            "parserOptions": {
                "project": ["tsconfig.json"],
                "tsconfigRootDir": "."
            }
        }
    ]
}
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
