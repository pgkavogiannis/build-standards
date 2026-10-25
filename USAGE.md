# Usage Notes

Non-obvious decisions explained.

## Why Spotless 3.10.4?

Latest 3.x release. Spotless 3.x requires Java 17+ and brings full Java 21 language support (records, sealed classes,
pattern matching). For Java 8 projects use the `jdk-8` branch, which pins Spotless to 2.30.0.

## Why Eclipse Java Formatter 4.41?

4.41 is the default bundled with Spotless 3.10.4 and supports all Java 21 syntax. It is pinned
explicitly because formatter upgrades change output with the same profile: moving from 4.39 to
4.41 reformats parameter lists that contain annotations such as `@Nullable`. Re-run
`samples/try-on-project.sh apply` before bumping it. Earlier versions (pre-4.20) require Java 11+
at minimum; pre-4.19 supports Java 8.

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

## Why override the Checkstyle engine (14.3.0)?

`maven-checkstyle-plugin` 3.6.0 (the latest release) still bundles Checkstyle 9.3 by default, which
fails to parse Java 21 syntax such as record patterns (`expecting '->'`). `repo-parent` adds
`com.puppycrawl.tools:checkstyle` as a plugin dependency, pinned by `checkstyle.version`. 14.x is
compiled for Java 21, so it needs a JDK 21 runtime.

## Why the 4-digit version scheme (MAJOR.MINOR.PATCH.BUILD)?

The 4-digit scheme (`1.0.0.0`) is a common enterprise convention where the 4th digit is a CI build counter.
If you prefer standard semver (`1.0.0`), change the `<version>` tags and drop the `.BUILD` segment.

## Why `tidy-maven-plugin`?

Enforces a canonical POM element order so diffs stay clean. Run `./mvnw tidy:pom` to auto-fix ordering.

## Why `gitflow-maven-plugin`?

Automates Git Flow branching (`develop → release/x.y → main`) including version bumps. Configure
`pushRemote` to `true` once your remote is set up.

## Why `dependency-check-maven` 13.0.0?

Latest release; requires JDK 11+ and Maven 3.8.1+. The parameters configured in `repo-parent`
(`nvdApiKey`, `failBuildOnCVSS`, `skipProvidedScope`, `ossIndexUsername`, `ossIndexPassword`) are
unchanged from 12.x. On this branch JDK 21 is the baseline so the plugin runs natively.

## Why `com.sun.xml.ws:jaxws-maven-plugin` 4.x?

The former `org.jvnet.jax-ws-commons:jaxws-maven-plugin` 2.3 relies on the JAX-WS tooling that was
removed from the JDK in Java 11, so it cannot run on JDK 21. Its successor is published as
`com.sun.xml.ws:jaxws-maven-plugin`; the 4.x line (Java 17+) generates Jakarta XML Web Services
code (`jakarta.xml.ws.*`). Projects still on `javax.xml.ws` must migrate imports and runtime
dependencies, or pin `com.sun.xml.ws:jaxws-maven-plugin` 2.3.7 themselves.

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

To move to another Maven version, run `mvn -N wrapper:wrapper -Dmaven=<version>` in an empty
directory, copy `mvnw`, `mvnw.cmd` and the `distributionUrl` across, and update
`distributionSha256Sum` (verify the download against the `.sha512` published next to it on Central).
