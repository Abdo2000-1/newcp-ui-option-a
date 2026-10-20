---
trigger: model_decision
description: Apply project-specific testing, verification, accessibility, responsive, and evidence gates.
---

# Testing and Quality

- Read `docs/05_QUALITY/testing-strategy.md` and `docs/03_WORKFLOW/definition-of-done.md` before planning verification.
- Use commands from the actual `package.json` or verified repository configuration; never invent commands or results.
- Cover applicable success, invalid, boundary, loading, empty, error, authorization, failure, accessibility, and responsive scenarios.
- Do not change tests to hide failures or weaken acceptance criteria.
- Record skipped checks, unavailable services, flaky behavior, warnings, and limitations in evidence.
- A build passing does not prove API integration, authentication, business correctness, or acceptance.
