# Usage Notes

Non-obvious decisions explained.

## Why Spotless 2.30.0 (not latest)?

Spotless 2.46.0+ dropped Java 8 support. If your projects still compile on Java 8, pin to 2.30.0.
When you upgrade to Java 11+, you can use the latest Spotless release.

## Why Eclipse Java Formatter 4.19.0?

Eclipse Formatter 4.20+ requires Java 11+. Pin to 4.19.0 for Java 8 compatibility.

## Why the 4-digit version scheme (MAJOR.MINOR.PATCH.BUILD)?

The 4-digit scheme (`1.0.0.0`) is a common enterprise convention where the 4th digit is a CI build counter.
If you prefer standard semver (`1.0.0`), change the `<version>` tags and drop the `.BUILD` segment.

## Why `tidy-maven-plugin`?

Enforces a canonical POM element order so diffs stay clean. Run `./mvnw tidy:pom` to auto-fix ordering.

## Why `gitflow-maven-plugin`?

Automates Git Flow branching (`develop → release/x.y → main`) including version bumps. Configure
`pushRemote` to `true` once your remote is set up.

## Why `dependency-check-maven` needs a JDK 11+?

OWASP Dependency Check 12.1.0+ requires JDK 11+ due to changes in the NVD data format. If you build
on JDK 8, run `dependency-check:check` separately with a JDK 11+ `JAVA_HOME`.

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
