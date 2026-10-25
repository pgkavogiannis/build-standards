# Claude Code template for consuming projects

Copy into a project that inherits `repo-parent`; see [IDE-SETUP.md](../../IDE-SETUP.md#claude-code) for what each file
does and the requirements (`jq`, `./mvnw`).

```bash
cp -r templates/claude-code/.claude <project>/
cat templates/claude-code/CLAUDE.java-style.md >> <project>/CLAUDE.md
chmod +x <project>/.claude/hooks/*.sh
```
