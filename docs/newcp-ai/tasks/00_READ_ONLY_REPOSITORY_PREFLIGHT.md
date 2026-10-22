# Task 00 — Read-only discovery and plan (run once in each repository)

You are in a real New CP source repository. **Do not edit files in this task.**
1. Read the applicable `AGENTS.md`, `docs/newcp-ai/README_START_HERE.md`, `docs/newcp-ai/policy/STATUS_AND_DECISIONS.md` and repo README/package scripts. Read only the task-relevant V0.6/V0.7 sources; avoid dumping every reference into context.
2. Identify whether this repo is the Node backend, React Option A or React Option B. List actual modules/paths related to selected service forms and existing auth/database integration. Compare actual code to proposed draft paths without assuming layout.
3. Identify runtime versions, package manager, existing tests/lint/typecheck/build and real vs mock API; do not run mutating or remote commands. Source code and permissions are confidential; do not expose secrets.
4. For the relevant selected vertical slice, return:
   - Found code paths with evidence (no guessed ones)
   - Relevant authoritative references and constraints
   - Decisions already implemented vs blockers (`R01`–`R14`)
   - Smallest proposed first PR, touched files and tests
   - Exact commands safe to run and data prerequisites
5. **Stop for technical-lead review**. Do not implement, commit, push, deploy, write DB or ask for credentials to paste into chat.
