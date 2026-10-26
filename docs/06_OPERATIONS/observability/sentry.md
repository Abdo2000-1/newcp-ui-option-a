# Sentry Integration Contract — React Option A

## Status and scope

This is a proposed frontend-only contract derived from the company Sentry
reference and the actual New CP repository. Sentry SDK installation and runtime
initialization are not part of this preparation PR.

The future integration covers unexpected React/runtime errors, API-boundary
failures, and bounded performance context. It does not replace application logs,
IAM audit records, API error contracts, or human incident response.

## Required controls

- `VITE_ENABLE_TELEMETRY` and a separate Sentry enable flag must both be true
  before initialization.
- An empty DSN or invalid configuration must produce a no-op adapter.
- `sendDefaultPii` must be false.
- Query strings, authorization headers, cookies, tokens, passwords, request
  bodies, PHI, customer data, and raw backend diagnostics must be scrubbed or
  excluded before capture.
- Expected `401`, `403`, `404`, `409`, `412`, `422`, and `428` domain outcomes
  should not be reported as unhandled defects merely because they are expected.
  Unexpected context may be recorded as bounded diagnostic metadata.
- Provider/network failure must never replace the application error state or
  interrupt user workflows.
- Source-map upload, release configuration, alert routing, and performance
  sampling require explicit owner approval and CI/deployment support.

## Safe configuration shape

Only variable names and disabled defaults belong in `.env.example`.

| Variable | Safe default | Meaning |
| --- | --- | --- |
| `VITE_SENTRY_ENABLED` | `false` | Provider kill-switch |
| `VITE_SENTRY_DSN` | empty | Frontend project DSN; obtain through approved config |
| `VITE_SENTRY_ENVIRONMENT` | empty | Derived from approved build environment when absent |
| `VITE_SENTRY_RELEASE` | empty | Approved commit/release identifier |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0` | No tracing until sampling is approved |
| `VITE_SENTRY_TRACK_EMAIL` | `false` | Email excluded unless privacy approval exists |

No backend `SENTRY_DSN`, CORS change, server middleware, or production endpoint
is introduced here.

## Context contract

Safe context may include bounded environment, route/module, sanitized error code,
and a correlation ID that is not a secret. User identity should use an approved
opaque identifier only. Tenant, role, or capability context requires IAM/privacy
approval and must never be used to make a client-side access decision.

Breadcrumbs should describe bounded workflow steps (for example, “report filter
applied”), not input values, patient names, clinical notes, tokens, or full
request payloads. Use one span for a meaningful user/system flow rather than a
span for every function.

## Backend dependency

The company reference includes Node/Express middleware and distributed tracing
headers. New CP has no backend implementation in this repository. When the
backend exists, a separate coordinated task must decide whether `sentry-trace`
and `baggage` are allowed by its CORS policy, how correlation IDs are mapped,
and which runtime owns server-side capture. Do not infer or implement that now.

## Verification evidence

After implementation, evidence must show:

1. Disabled-by-default behavior and no DSN/network activity.
2. A deterministic non-production frontend test event using synthetic data.
3. React error-boundary and API-client capture behavior without changing UX.
4. Scrubbing of secrets, query strings, and sensitive payloads.
5. Expected domain errors are filtered or classified correctly.
6. Release/environment tags are correct without claiming production success.

Production smoke tests, alert configuration, source maps, and live dashboard
evidence remain blocked until their owners and safe targets are explicitly
approved.
