# New CP Observability — Provider-Ready Runtime Foundation

## Status

The New CP React Option A repository is **runtime-ready** for PostHog and Sentry integration:
- Official SDKs (`posthog-js` and `@sentry/react`) are installed and wired through central adapters.
- Provider initialization, error isolation, privacy scrubbing, expected-domain filtering, and runtime diagnostics are fully implemented and verified with tests.
- Both providers are **disabled by default**.
- **No real keys, DSNs, tokens, or credentials exist in this repository.**

Current status: `RUNTIME READY` / `PENDING SENIOR ENGINEER CONFIGURATION` (Live external delivery is `NOT VERIFIED` until real credentials and network traffic are confirmed).

## Responsibilities

| Concern | Provider | New CP use | Default |
| --- | --- | --- | --- |
| Product usage and deliberate business interaction analytics | PostHog | Approved, sanitized client events only | Disabled (`VITE_POSTHOG_ENABLED=false`) |
| Unexpected frontend errors and bounded performance context | Sentry | React/runtime/API-boundary errors with safe context | Disabled (`VITE_SENTRY_ENABLED=false`) |
| Structured application logs | Existing repository/application | Remains the source for normal diagnostics | Existing behavior |
| Backend errors and distributed traces | Sentry backend project | Separate backend task and owner | Not in this repo |

PostHog answers “what did the user deliberately do?” Sentry answers “what unexpectedly failed?” Neither replaces authorization, audit logging, API validation, or business records.

## Architecture Boundary

Application components never import `posthog-js` or `@sentry/react` directly. All telemetry flows through typed, no-op-safe adapters under `@/shared/observability`. Provider failure never breaks navigation, authentication, forms, mock data, or API workflows.

```text
React routes/components
        |
        v
@/shared/observability (safe No-Op by default)
        |----------------------|
        v                      v
PostHogAdapter           SentryAdapter
  (posthog-js)           (@sentry/react)
        |                      |
  PostHog Cloud          Sentry Project
(Awaiting values)      (Awaiting values)
```

## Documentation Sitemap

1. [Provider Activation Guide](./provider-activation-guide.md) — Exact values the senior engineer must supply and step-by-step activation checklist.
2. [PostHog Integration Contract](./posthog.md) — Detailed PostHog rules, privacy requirements, and configuration shape.
3. [Sentry Integration Contract](./sentry.md) — Detailed Sentry rules, domain error classification, and scrubbing rules.
4. [Telemetry Event Contract](./telemetry-event-contract.md) — The 9 approved low-volume canonical events.
5. [Readiness Checklist](./readiness-checklist.md) — Implementation, verification, and release gates.
6. [Reference Analysis](./company-reference-analysis.md) — Architecture decisions and company reference comparison.
7. [Local Setup & Verification Guide](./local-setup-guide.md) — Safe local environment configuration, placeholder usage, and test verification procedures.
