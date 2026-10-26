---
paths:
  - "src/**/*.{ts,tsx}"
  - "docs/06_OPERATIONS/observability/**/*"
  - ".env.example"
  - ".agents/rules/observability.md"
  - ".claude/rules/observability.md"

# Observability Rules

- Read `docs/06_OPERATIONS/observability/README.md` and the relevant provider
  contract before changing telemetry or error monitoring.
- Adapt the supplied company references to React/Vite; do not copy Vue/Node
  paths, production URLs, DSNs, project IDs, or credentials.
- Keep global and provider kill-switches disabled by default and use no-op-safe
  typed adapters. Do not import SDKs directly from feature components.
- Never put PHI, patient/customer identifiers, clinical notes, financial values,
  passwords, tokens, cookies, authorization headers, query secrets, or full
  payloads into telemetry, logs, screenshots, or evidence.
- Telemetry cannot enforce authorization, tenant isolation, audit, or business
  rules. API/server behavior remains authoritative.
- Use deliberate bounded PostHog events; no autocapture or duplicate pageviews.
  Sentry receives unexpected failures with scrubbed context, not every expected
  domain error.
- Replay, email identity, source maps, tracing, alerts, and production checks
  require explicit approval and real evidence.
- Never claim provider delivery or production verification without evidence.
