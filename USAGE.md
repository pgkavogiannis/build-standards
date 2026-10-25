# Usage Notes

Non-obvious decisions explained.

## Why Spotless 2.30.0 (not latest)?

Spotless 2.46.0+ dropped Java 8 support. If your projects still compile on Java 8, pin to 2.30.0.
When you upgrade to Java 11+, you can use the latest Spotless release.

## Why Eclipse Java Formatter 4.19.0?

Eclipse Formatter 4.20+ requires Java 11+. Pin to 4.19.0 for Java 8 compatibility.

The style profile (`repo_java_style.xml`) is shared with the JDK 21 line on `main`, where it was tuned on
Eclipse 4.41. On the pinned jsoup commit used by `samples/try-on-project.sh`, 4.19.0 produces byte-identical
output, so the profile carries over unchanged. Re-run `samples/try-on-project.sh apply` after changing it.

## Where do the Java style settings come from?

They were derived from hand-reformatted code rather than chosen setting by setting: a real project
(jsoup) was formatted with the profile, files were hand-edited into the desired style, and settings
were changed until Spotless left those edits alone. The resulting decisions and the setting behind
each one are listed in `samples/formatting-sample/README.md`; repeat the workflow described there
to change the style.

Braces and member order are Checkstyle rules (`NeedBraces`, `DeclarationOrder`), not formatter
output: the Eclipse formatter only changes whitespace. Wrap long boolean or `+` expressions
*after* the operator: a manual break before an operator is joined back by the formatter.

## Why custom Checkstyle checks in `repo-code-quality-configs`?

Two rules cannot be expressed by the Eclipse formatter or by stock Checkstyle:

- `BlankLinesInBody`: blank line after `{`, before the final `return`, and before `}` of `void`
  methods and constructors, only when the body has more than `maxSmallBodySize` (4) top-level
  statements (types: members). Eclipse's blank-line settings are unconditional and would pad
  every multi-line method.
- `UnnecessaryParameterWrap`: a wrapped parameter list whose declaration fits in 160 columns.
  Eclipse can only re-join wrapped lines globally (`join_wrapped_lines`), which would also
  collapse call arguments that are deliberately kept one per line.

They live in `buildstandards.checkstyle` inside the same JAR as the config files, which
`repo-parent` already puts on the Checkstyle plugin's classpath, so consuming projects need no
extra setup. Both report and fail the build; neither rewrites code. `ShippedConfigTest` loads the
shipped `checkstyle.xml` so a misnamed module or property fails this repo's build, not a consumer's.
Tune them in `checkstyle.xml` (`maxSmallBodySize`, `max`).

On this branch they are compiled for Java 8 against Checkstyle 9.3 and tested with JUnit 5 (JUnit 6
requires Java 17). The same sources compile unchanged against the 14.x engine on `main`.

## Why is `FinalLocalVariable` a warning?

Existing code rarely declares locals `final` (7,104 hits on jsoup), so failing the build would
block adoption. Warnings show up in the build log; IDE quick fixes add the modifiers. Parameters
and enhanced-for variables are exempt (the check's defaults). Members are not sorted by name or line
length. Checkstyle has no such rule, and Eclipse's Sort Members (exposed by Spotless as
`sortMembersEnabled`) sorts by name only, also reorders every method, and with field sorting
enabled can reorder initializers into an illegal forward reference or a different static
initialization order.

## IDE and Claude Code setup

See `IDE-SETUP.md`. The hooks in `templates/claude-code/` are meant for consuming projects, not this repository: its
root reactor declares neither Spotless nor Checkstyle.

## Why pin the Checkstyle engine (9.3)?

`maven-checkstyle-plugin` 3.6.0 bundles Checkstyle 9.3, and 10.0+ requires Java 11+. `repo-parent`
still declares `com.puppycrawl.tools:checkstyle` as a plugin dependency, pinned by `checkstyle.version`,
so the engine the custom checks are compiled against is explicit and cannot drift with a plugin upgrade.

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

The wrapper is Apache Maven Wrapper 3.3.4 in `only-script` mode: there is no `maven-wrapper.jar`,
the scripts download Maven directly and verify it against `distributionSha256Sum`. It defaults to
Apache Maven Central. If your org requires an internal mirror (Artifactory, Nexus), uncomment and
fill in `{{MAVEN_DISTRIBUTION_URL}}` in `.mvn/wrapper/maven-wrapper.properties`; the checksum stays
valid as long as the mirror serves the same artifact.

Maven stays on 3.9.x on this branch: it is the line that still runs on JDK 8. To move to another
3.9.x release, update `distributionUrl` and `distributionSha256Sum` (verify the download against the
`.sha512` published next to it on Central).
