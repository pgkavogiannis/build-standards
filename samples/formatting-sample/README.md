# Formatting sample

Small project (Java 8-compatible syntax, so it also works on the `jdk-8` branch) for exercising the shared Spotless (Eclipse formatter) and Checkstyle configuration
from `repo-code-quality-configs`. It is **deliberately failing**: `verify` is expected to break at the
`validate` phase. It is not listed in the root `<modules>`, so it never affects the real build.

| File                     | Spotless | Checkstyle | Purpose                                                                                       |
|--------------------------|----------|------------|-----------------------------------------------------------------------------------------------|
| `Greeter.java`           | pass     | pass       | Reference "good" file, including a hand-aligned `@formatter:off/on` block that must survive   |
| `MessyOrderService.java` | **fail** | pass       | Allman braces, `else`/`catch`/`finally` on own line, missing spaces, bad indent, `{return x;}` one-liner, ragged builder chain, long call needing arg wrapping, `+` chain past 160 columns |
| `StyleViolations.java`   | **fail** (tab, `new int[]{..}` spacing, blank lines before `}`, parameter wrap) | **fail** (19 errors, 1 warning) | Star/unused/duplicate imports, naming, simplifiable booleans, braceless `if` (`NeedBraces`), field visibility order (`DeclarationOrder`), large body without blank lines (`BlankLinesInBody`), wrapped parameters that fit (`UnnecessaryParameterWrap`), non-final local (`FinalLocalVariable`, warning), array style, `10l`, tab, `InterfaceIsType` |

## Quick start (works on the unbootstrapped template)

```bash
samples/formatting-sample/try-it.sh          # show spotless + checkstyle failures
samples/formatting-sample/try-it.sh apply    # ...and the diff spotless:apply would make
MVN=mvn samples/formatting-sample/try-it.sh  # use a system Maven instead of ./mvnw
```

The script copies the repo to a temp dir, installs `repo-code-quality-configs` (config files plus the custom checks,
with their unit tests skipped) + `repo-parent` into `~/.m2` under the project's groupId, and runs the checks. Your
working tree is untouched.

## Running directly (after installing the shared configs)

```bash
./mvnw install -pl repo-code-quality-configs,repo-parent -am   # once, from repo root
cd samples/formatting-sample
../../mvnw spotless:check      # formatting
../../mvnw spotless:apply      # fix formatting in place
../../mvnw checkstyle:check    # style rules
../../mvnw tidy:check          # POM element order
```

Run the goals individually: both plugins are bound to `validate`, so `mvn verify` stops at whichever fails first.
Skip flags: `-Dspotless.check.skip=true`, `-Dcheckstyle.skip=true`.

## Things this sample shows about the current profile

- `else`/`catch`/`finally` are cuddled (`} else {`).
- One-line method bodies are kept as written and get spaces inside the braces: `customerCount(){return x;}` becomes
  `customerCount() { return x; }`; multi-line bodies (including empty ones) stay multi-line (`keep_method_body_on_one_line=one_line_preserve`).
- Continuation lines (wrapped parameters, arguments, `.call()` chains, operators, array elements) are indented +4,
  one indent level, never column-aligned (see `label`, `describe`).
- Method-call arguments wrap one per line past 160 columns (see `describe`); a declaration that fits stays on one line.
- Binary operators (`+`, `&&`, `||`, ...) wrap where necessary past 160 columns, operator at the end of the line (see
  `banner`). A manual break **before** an operator is joined back, because the wrap position is after the operator.
- `join_wrapped_lines=false`: manual line breaks are kept, so the formatter never joins a deliberately wrapped call.
  Wrapped *parameter lists* that would fit are reported by `UnnecessaryParameterWrap` instead and joined by hand.
- A blank line after a type's opening `{` is kept if present but not forced by the formatter; a blank line before its
  closing `}` is enforced. Up to 2 blank lines are preserved; trailing whitespace is trimmed.
- Braces, member order, the size-dependent blank lines and `final` locals are Checkstyle rules, not formatter output
  (see the table below).
- Checkstyle intentionally suppresses `MemberName` and `EmptyStatement` (`suppressions.xml`), so the sample does not
  try to trigger them.

## Larger, real-world test: jsoup

`samples/try-on-project.sh` runs the same Spotless + Checkstyle config against [jsoup](https://github.com/jhy/jsoup)
(MIT, single-module Maven, Java 8 source, ~31k main + ~34k test lines, no formatter/linter of its own), pinned to commit
`0c508f1`. It fetches into a temp dir and patches the pom there only; nothing is vendored into this repo.

```bash
samples/try-on-project.sh            # spotless:check + checkstyle:check with a per-rule summary
samples/try-on-project.sh apply      # also run spotless:apply and report the size of the diff
KEEP=1 samples/try-on-project.sh apply   # keep the temp dir; prints a 'git diff' command to browse the result
samples/try-on-project.sh -- <git-url> <sha-or-tag>   # any other single-module Maven project
```

Baseline on the `main` line (Spotless 3.10.4 / Eclipse 4.41 / Checkstyle plugin 3.6.0 with engine 14.3.0):

- **Spotless:** 195 of 216 Java files change (+8,124 / −4,185).
- **Checkstyle:** 4,983 violations: `BlankLinesInBody` 3,118, `NeedBraces` 1,282 (jsoup uses braceless `if`s),
  `ConstantName` 282 (CamelCase `static final` names), `DeclarationOrder` 126, `AvoidStarImport` 81, `MethodName` 33,
  `UnusedImports` 22, `StaticVariableName` 15, `FileTabCharacter` 10, `LocalFinalVariableName` 5,
  `UnnecessaryParameterWrap` 5, `LocalVariableName` 3, `NewlineAtEndOfFile` 1; plus 7,104 `FinalLocalVariable` warnings.

Style decisions taken from two rounds of hand-edited jsoup files (`examples`, `helper`, `safety`), the hand-written
samples in this directory, and stated rules; formatter settings were measured by re-running Spotless over the
hand-edited version and minimizing what it would change:

| Decision | Setting |
|---|---|
| Type-use annotations stay inline with the parameter: `@Nullable String baseUri` | `insert_new_line_after_annotation_on_parameter=do not insert` |
| One-line method bodies are kept, written `{ return x; }` | `keep_method_body_on_one_line=one_line_preserve` |
| Continuation indent +4 (one level) | `continuation_indentation=1`, `continuation_indentation_for_array_initializer=1` |
| Wrapped `.call()` chains: no column alignment | `alignment_for_selector_in_method_invocation=80` |
| Wrapped array initializer elements: no column alignment | `alignment_for_expressions_in_array_initializer=48` |
| Binary operators wrap where necessary, so nothing is joined past 160 columns | `alignment_for_{additive,string_concatenation,logical,relational,bitwise,multiplicative,shift}_operator=16` |
| Blank line after a type header is allowed, not forced (none after anonymous/enum-constant headers) | `blank_lines_before_first_class_body_declaration=0` |
| No trailing whitespace (the formatter leaves some on blank comment lines) | Spotless `<trimTrailingWhitespace/>` |
| Braces on every `if`/`else`/`for`/`while`/`do` | Checkstyle `NeedBraces` |
| Static fields, fields, constructors, methods; public→protected→package→private within fields | Checkstyle `DeclarationOrder` |
| Bodies with more than 4 top-level statements (methods) or members (types): blank line after `{`; blank line before the final `return`; blank line before `}` of `void` methods and constructors | custom `BlankLinesInBody` (`maxSmallBodySize=4`) |
| A parameter list that fits in 160 columns is not wrapped | custom `UnnecessaryParameterWrap` (`max=160`) |
| Locals that are never reassigned are `final` (parameters and loop variables exempt) | `FinalLocalVariable`, severity warning |

"Small" counts top-level statements, not lines: the samples keep e.g. a single 11-line `String.format(...)` call or a
7-line `try` without blank lines, and a 5-line method with 3 statements without a blank before `return`. On the
hand-edited jsoup packages the custom checks report 8 blank-line and 1 wrapping violation, all places the rule was
missed by hand (e.g. the 5-assignment `Safelist()` constructor). The +4 continuation indent re-indents what the
earlier hand edits wrote at +8. Annotations on methods, fields and types stay on their own line (`=49`); an annotation
written between modifiers (`private @Nullable String x`) stays where it is, because the formatter only moves
whitespace. Member sorting by name or line length is not enforced: Checkstyle has no such rule, and Eclipse's
Sort Members (available in Spotless as `sortMembersEnabled`) only sorts by name and can break field initialization order.

## Teaching the profile your style (hand-edit workflow)

To change `repo_java_style.xml` from examples instead of guessing at Eclipse settings:

```bash
KEEP=1 samples/try-on-project.sh apply     # prints a project path; Spotless output is committed as "spotless-applied"
# edit files in that directory by hand into the style you want (don't re-run spotless:apply)
git -C <printed path> diff --stat                 # what you touched
git -C <printed path> diff > style-feedback.patch # capture it
```

Because the baseline is the profile's own output, `git diff` there contains only the places where the current profile
differs from what you want. A handful of files that cover your typical code (annotations, long signatures, chains,
lambdas, enums, comments, blank-line habits) is enough; there is no need to reformat the whole project. Share the
patch (commit it on a branch, or paste it) plus a line or two of intent for any change that isn't obvious from the
diff. Each distinct hunk pattern is then mapped to an Eclipse setting, and the profile is re-run on the same project
to confirm the diff shrinks to zero.
