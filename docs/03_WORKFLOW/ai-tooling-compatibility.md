# AI Tooling Compatibility

## Primary supported workspace

This repository is prepared for Google Antigravity workspace discovery:

- `AGENTS.md` is the always-on repository instruction file.
- `.agents/rules/*.md` contains Antigravity-native rules with valid `trigger` frontmatter.
- `.agents/skills/<name>/SKILL.md` contains workspace skills with `name` and `description` frontmatter.
- `.agents/agents/*.md` contains optional read-only custom subagents with Antigravity-compatible frontmatter.

The model is selected by the Antigravity application or agent configuration. The repository does not hard-code a model name into normal skills, so the workflow remains portable across approved Gemini model tiers. The custom subagents use `model: flash` as a tier preference where Antigravity supports it.

## Compatibility layer

The existing `.claude/` and `CLAUDE.md` files remain as a Claude Code compatibility layer because the original engineering task requested Claude Code conventions. They are not the Antigravity discovery mechanism and must not be treated as a second independent source of truth.

For workflow, scope, traceability, security, testing, and evidence decisions, `AGENTS.md`, `.agents/`, and the numbered `docs/` system are authoritative for Antigravity work. Keep the compatibility layer synchronized when a shared rule changes.

## Verification checklist

Before using Antigravity on a task:

1. Open the repository root, not only `src/`.
2. Confirm the Customizations panel lists the workspace rules and skills.
3. Confirm the expected skill is available by its slash command, for example `/plan-task`.
4. Ask the agent to read `docs/00_READ_FIRST.md` before implementation.
5. Require actual command output and review the diff before accepting changes.
