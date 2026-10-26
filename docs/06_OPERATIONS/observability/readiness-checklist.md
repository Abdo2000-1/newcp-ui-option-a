# Observability Readiness Checklist

Use this checklist for a future implementation PR. This preparation package is
complete without checking the provider boxes below.

## Before coding

- [ ] Product/privacy owner approved PostHog and Sentry use.
- [ ] Provider projects, region, ownership, and retention are documented.
- [ ] Approved event vocabulary and sensitive-field classification exist.
- [ ] Backend owner confirmed whether distributed tracing is supported.
- [ ] No real credentials or production data are present in the task or test data.
- [ ] A bounded task ID and allowed files are approved.

## Implementation gates

- [ ] Provider adapters are centralized and no-op safe.
- [ ] `VITE_ENABLE_TELEMETRY` and provider kill-switches default to disabled.
- [ ] SDK versions are compatible with the existing React/Vite/toolchain and are
      recorded in the lockfile.
- [ ] PostHog autocapture and automatic pageviews are disabled.
- [ ] Sentry PII/request scrubbing and expected-error filtering are tested.
- [ ] Auth identity is reset on logout; no client telemetry decision grants access.
- [ ] Session replay/feature flags are not enabled without separate approval.

## Verification gates

- [ ] `npm ci`, lint, typecheck, tests, and production build run with actual
      results.
- [ ] Disabled-mode network behavior is verified.
- [ ] Non-production synthetic smoke events are verified in the correct projects.
- [ ] Sensitive-value redaction is verified with tests and sanitized evidence.
- [ ] Provider outage/blocking does not break app behavior.
- [ ] Accessibility and responsive behavior remain unchanged.
- [ ] CI uses configured secrets only; no values are written to repository files.

## Release gates

- [ ] Human review completed for privacy, security, architecture, and business
      correctness.
- [ ] Alert ownership and runbook are documented.
- [ ] Release/source-map policy is approved before source-map upload.
- [ ] Production evidence is captured only against an explicitly approved target.
- [ ] The PR states what was not verified and any remaining backend blockers.
