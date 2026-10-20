---
paths:
  - "newcp-api/tests/**/*"
  - "newcp-api/src/**/*.{ts,tsx}"
  - "src/**/*.{ts,tsx}"
  - "newcp-ui-option-b/**/*.{ts,tsx}"
  - "tests/**/*"
---

# Testing and Quality Rules

- Run the actual repository commands from its manifest/configuration; never substitute invented commands or results.
- Cover applicable success, invalid, boundary, loading, empty, error, authorization, and failure cases.
- Repeated same-type service independence and tenant isolation require explicit tests, regardless of aggregate coverage.
- Do not change tests to hide a failure or weaken acceptance criteria.
- Record skipped checks, unavailable services, flaky behavior, and limitations in evidence.
- Review accessibility and responsive behavior for critical UI actions; aggregate coverage does not prove usability.

## Delivery quality gates

- For every implementation task, assess the applicable CI/PR gates: lockfile-based dependency install, lint, typecheck, unit/component/integration/E2E tests, production build, and evidence generation.
- Treat SonarQube or the approved quality scanner as a required evidence gate when the project environment provides it. Never claim a clean scan without an actual run and result link.
- Validate Docker/container readiness and image build/validation when the approved delivery path supports containers. Do not invent a registry, image name, runtime secret, or deployment target.
- Reuse the approved CI provider and repository workflow. GitHub Actions is used only when GitHub is the confirmed CI host and the required configuration/permissions are available.
- If a required gate, scanner, container runtime, workflow provider, secret, service, or test environment is unavailable, record the blocker and limitation instead of skipping it silently or treating the task as fully verified.
- Keep task documentation, PR summary, AI usage record, contribution record, and sanitized evidence synchronized with the actual checks performed.
