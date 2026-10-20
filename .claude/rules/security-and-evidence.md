# Security and Evidence Rules

- Never place secrets, tokens, PHI, customer data, production dumps, or private keys in code, prompts, logs, telemetry, screenshots, or evidence.
- Authentication is not complete because a login button renders. Require approved provider/configuration, session/token handling, protected-route behavior, and test evidence.
- Normalize errors without raw SQL, stack traces, PII, or sensitive authorization details.
- Evidence must state requirement/task ID, environment, procedure/command, result, reviewer, and limitation.
- Distinguish simulated, mocked, local, test-environment, and live integration results.
- Human owners approve architecture, business behavior, security decisions, merge, release, and production actions.

