# New CP Observability

## Status

This is a preparation and control package. PostHog and Sentry are **not
installed, initialized, enabled, or verified** by this package.

Current status: `NOT VERIFIED` / `BLOCKED` for live provider delivery.

## Responsibilities

| Concern | Provider | New CP use | Default |
| --- | --- | --- | --- |
| Product usage and deliberate business interaction analytics | PostHog | Approved, sanitized client events only | Disabled |
| Unexpected frontend errors and bounded performance context | Sentry | React/runtime/API-boundary errors with safe context | Disabled |
| Structured application logs | Existing repository/application | Remains the source for normal diagnostics | Existing behavior |
| Backend errors and distributed traces | Sentry backend project | Separate backend task and owner | Not in this repo |

PostHog answers “what did the user deliberately do?” Sentry answers “what
unexpectedly failed?” Neither replaces authorization, audit logging, API
validation, or business records.

## Read in this order

1. [Reference analysis](./company-reference-analysis.md)
2. [PostHog integration contract](./posthog.md)
3. [Sentry integration contract](./sentry.md)
4. [Telemetry event contract](./telemetry-event-contract.md)
5. [Readiness checklist](./readiness-checklist.md)
6. `.agents/rules/observability.md` or `.claude/rules/observability.md`
7. The relevant observability skill before implementation or verification.

## Architecture boundary

Future code should have provider-specific adapters under a shared observability
boundary. Feature components should call typed, no-op-safe helpers rather than
importing `posthog-js` or `@sentry/react` directly. Provider failure must never
break navigation, authentication, forms, mock data, or API workflows.

```text
React routes/components
        |
        v
shared observability port (no-op-safe)
        |----------------------|
        v                      v
PostHog adapter           Sentry adapter
        |                      |
   PostHog Cloud          Sentry project
```

## Explicit non-goals

- No backend integration, database access, IAM enforcement, or audit-log
  replacement.
- No real credentials, DSNs, API keys, PHI, customer data, or production logs.
- No broad component refactor to add telemetry.
- No automatic capture of every click, keystroke, input, URL query, or request
  body.
- No claim of provider delivery until a safe test environment produces evidence.
