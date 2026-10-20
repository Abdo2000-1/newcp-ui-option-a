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
