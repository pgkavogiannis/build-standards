# IDE and Claude Code setup

`./mvnw spotless:apply` and `./mvnw spotless:check checkstyle:check` are the source of truth. The settings below make
IntelliJ and Claude Code produce code that already passes them; CI still decides.

`.editorconfig` sets `max_line_length = 160`, the same limit as the formatter (`lineSplit`) and Prettier
(`printWidth`). IntelliJ applies it as the right margin automatically.

## IntelliJ IDEA

Config files live in `repo-code-quality-configs/src/main/resources/` (or inside
`repo-code-quality-configs-<version>.jar` in `~/.m2` for projects that only consume the parent).

| Goal | Where | Setting |
|---|---|---|
| Format exactly like Spotless (recommended) | Plugin **Adapter for Eclipse Code Formatter** | Enable "Use Eclipse's Code Formatter", point it at `repo_java_style.xml`, select its profile. It runs the Eclipse formatter itself; output matches Spotless when the plugin uses Eclipse 4.41. |
| Format with IntelliJ's own formatter (approximate) | Settings → Editor → Code Style → Java → ⚙ → Import Scheme → Eclipse XML Profile | Import `repo_java_style.xml`. The conversion is lossy: one-line method preservation, wrap policies and some blank-line rules do not map exactly. |
| Run the real Spotless from the IDE | Plugin **Spotless Applier** | Applies the project's `spotless:apply` to the current file or project. |
| Checkstyle in the editor | Plugin **CheckStyle-IDEA** | Checkstyle version 14.3.0 (or the closest 14.x offered). Add `checkstyle.xml` as a configuration; when asked for `checkstyle.suppressions.file`, give the path of `suppressions.xml`. Under **Third-Party Checks** add `repo-code-quality-configs-<version>.jar`, otherwise the custom checks (`BlankLinesInBody`, `UnnecessaryParameterWrap`) fail to load. |
| No star imports (`AvoidStarImport`) | Code Style → Java → Imports | "Class count to use import with '\*'" and "Names count to use static import with '\*'" = 999. |
| Braces everywhere (`NeedBraces`) | Code Style → Java → Wrapping and Braces → Force braces | Always, for `if`, `for`, `while`, `do-while`. |
| `final` locals (`FinalLocalVariable`) | Inspections → Java → Code style issues → "Local variable or parameter can be 'final'" | Enable, report local variables only (not parameters). |
| Member order (`DeclarationOrder`), optional | Code Style → Java → Arrangement | Static fields, fields, constructors, methods; fields public → protected → package → private. Applied by Code → Rearrange Code. |
| On save | Tools → Actions on Save | Reformat code, Optimize imports. Set the import counts above first, or optimize imports reintroduces `*` imports. |

The size-dependent blank lines and unnecessary parameter wraps have no IntelliJ equivalent: CheckStyle-IDEA highlights
them and they are fixed by hand.

## Claude Code

`templates/claude-code/` holds files for projects that inherit `repo-parent`. Copy them into the project root:

```bash
cp -r templates/claude-code/.claude <project>/        # merge with an existing .claude/settings.json by hand
cat templates/claude-code/CLAUDE.java-style.md >> <project>/CLAUDE.md
chmod +x <project>/.claude/hooks/*.sh
```

| File | What it does |
|---|---|
| `CLAUDE.java-style.md` | Section for the project's `CLAUDE.md`: run the tools, plus the rules the formatter cannot fix (braces, blank lines, wrapping, `final`, member order). |
| `.claude/settings.json` | Registers the two hooks below. |
| `.claude/hooks/spotless-file.sh` | **PostToolUse** on Edit/MultiEdit/Write: `spotless:apply` limited to the edited `.java` file (~5 s). |
| `.claude/hooks/checkstyle-gate.sh` | **Stop**: when `.java` files changed, runs `spotless:check` and `checkstyle:check` (~10 s) and blocks finishing with the findings until they are fixed. Check-only, skips when no Java changed, never loops (gives up after one retry), and does not block on build errors that are not findings. |

Requirements: `jq`, and `./mvnw` (or `mvn`) at the project root. Without them the hooks do nothing.

Do not enable these hooks in this repository: its root reactor does not declare Spotless or Checkstyle, so the Stop
gate would have nothing to run against.
