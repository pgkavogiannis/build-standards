## Java style

Formatting and style come from the shared build standards (`repo-parent`). `./mvnw spotless:apply` and
`./mvnw checkstyle:check` are the source of truth; the hooks in `.claude/` run them automatically.

- After editing Java, run `./mvnw spotless:apply`; before finishing, `./mvnw spotless:check checkstyle:check` must pass.
- Not fixed by the formatter, write these correctly:
  - Braces on every `if`/`else`/`for`/`while`/`do`.
  - A method or constructor body with more than 4 top-level statements gets a blank line after `{` and before the
    final `return`; `void` methods and constructors also get one before `}`. Type bodies with more than 4 members get
    a blank line after `{`.
  - Do not wrap a parameter list whose declaration fits in 160 columns.
  - Locals that are never reassigned are `final` (parameters and loop variables are not).
  - Member order: static fields, fields, constructors, methods; fields public, protected, package, private.
  - No star imports.
- Wrap long `&&`/`||`/`+` expressions after the operator (a break before it is joined back). Continuation indent is 4.
