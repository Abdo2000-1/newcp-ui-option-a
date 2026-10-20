---
trigger: always_on
description: Apply project-specific testing, verification, accessibility, responsive, and evidence gates.
---

# Testing and Quality

- Read `docs/05_QUALITY/testing-strategy.md` and `docs/03_WORKFLOW/definition-of-done.md` before planning verification.
- Use commands from the actual `package.json` or verified repository configuration; never invent commands or results.
- Cover applicable success, invalid, boundary, loading, empty, error, authorization, failure, accessibility, and responsive scenarios.
- Do not change tests to hide failures or weaken acceptance criteria.
- Record skipped checks, unavailable services, flaky behavior, warnings, and limitations in evidence.
- A build passing does not prove API integration, authentication, business correctness, or acceptance.

## Delivery quality gates

- For every implementation task, assess the applicable CI/PR gates: lockfile-based dependency install, lint, typecheck, unit/component/integration/E2E tests, production build, and evidence generation.
- Treat SonarQube or the approved quality scanner as a required evidence gate when the project environment provides it. Never claim a clean scan without an actual run and result link.
- Validate Docker/container readiness and image build/validation when the approved delivery path supports containers. Do not invent a registry, image name, runtime secret, or deployment target.
- Reuse the approved CI provider and repository workflow. GitHub Actions is used only when GitHub is the confirmed CI host and the required configuration/permissions are available.
- If a required gate, scanner, container runtime, workflow provider, secret, service, or test environment is unavailable, record the blocker and limitation instead of skipping it silently or treating the task as fully verified.
- Keep task documentation, PR summary, AI usage record, contribution record, and sanitized evidence synchronized with the actual checks performed.
