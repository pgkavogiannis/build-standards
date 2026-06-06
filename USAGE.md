# Usage Notes

Non-obvious decisions explained.

## Why Spotless 3.6.0?

Spotless 3.x requires Java 17+ and brings full Java 21 language support (records, sealed classes,
pattern matching). For Java 8 projects use the `java-8` tag on `main` which pins Spotless to 2.30.0.

## Why Eclipse Java Formatter 4.39?

4.39 is the default bundled with Spotless 3.6.0 and supports all Java 21 syntax. Earlier versions
(pre-4.20) require Java 11+ at minimum; pre-4.19 supports Java 8.

## Why the 4-digit version scheme (MAJOR.MINOR.PATCH.BUILD)?

The 4-digit scheme (`1.0.0.0`) is a common enterprise convention where the 4th digit is a CI build counter.
If you prefer standard semver (`1.0.0`), change the `<version>` tags and drop the `.BUILD` segment.

## Why `tidy-maven-plugin`?

Enforces a canonical POM element order so diffs stay clean. Run `./mvnw tidy:pom` to auto-fix ordering.

## Why `gitflow-maven-plugin`?

Automates Git Flow branching (`develop → release/x.y → main`) including version bumps. Configure
`pushRemote` to `true` once your remote is set up.

## Why `dependency-check-maven` 12.1.3?

OWASP Dependency Check 12.1.0+ requires JDK 11+ due to changes in the NVD data format. On this
branch JDK 21 is the baseline so the plugin runs natively with no extra configuration.

## Why `ossIndexUsername` / `ossIndexPassword` in the POM?

Sonatype OSS Index provides enhanced vulnerability data. Credentials are optional but increase the
API rate limit. Store these in your CI secrets manager and inject via `-DossIndexUsername=...` on
the command line, or move them to `~/.m2/settings.xml`.

## Why `{{COMPONENT_PREFIX}}` instead of just `app`?

Angular enforces unique component prefixes per project. Replace `{{COMPONENT_PREFIX}}` with your
org-wide prefix (e.g. `acme`) to ensure all components use consistent selectors.

## Maven Wrapper and internal Artifactory

The wrapper defaults to Apache Maven Central. If your org requires an internal mirror (Artifactory,
Nexus), uncomment and fill in `{{MAVEN_DISTRIBUTION_URL}}` in `.mvn/wrapper/maven-wrapper.properties`.
