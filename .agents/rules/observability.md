---
trigger: always_on
description: Apply safe PostHog and Sentry observability boundaries for New CP React Option A.
---

# Observability Rules

- Read `docs/06_OPERATIONS/observability/README.md` and the provider-specific
  contract before changing telemetry, error capture, feature flags, or replay.
- Treat the company PostHog/Sentry documents as methodology references only;
  adapt their Vue/Node examples to this React/Vite repository and never copy
  their hosts, project IDs, DSNs, user names, or production commands.
- Keep `VITE_ENABLE_TELEMETRY` and provider-specific kill-switches disabled by
  default. Do not add real credentials or enable a provider in committed config.
- Centralize SDK calls behind typed, no-op-safe adapters. Feature components must
  not import provider SDKs directly.
- Do not use telemetry for authorization, tenant isolation, audit compliance, or
  business persistence. The server/API remains authoritative.
- Never emit PHI, patient/customer identifiers, clinical notes, financial values,
  passwords, tokens, cookies, authorization headers, query secrets, or full
  request/response bodies.
- PostHog uses deliberate low-volume events only; autocapture and duplicate
  automatic pageviews stay disabled. Every flag has a deterministic fallback.
- Sentry captures unexpected failures with bounded context; classify or filter
  expected domain errors and preserve the application's error UX.
- Do not add replay, email identity, source maps, tracing, alerts, or production
  smoke tests without explicit owner/privacy approval and evidence requirements.
- Do not claim provider delivery, dashboard configuration, CI secret readiness,
  or production verification without actual evidence.
