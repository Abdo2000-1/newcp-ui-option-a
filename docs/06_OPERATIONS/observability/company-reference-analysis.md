# Observability Reference Analysis

## Purpose

This document records what was learned from the company reference documents and
what was intentionally adapted for New CP React Option A.

## Source material inspected

- `posthog-integration.md` — company InsightHub Vue 3 PostHog guide.
- `sentry-integration.md` — company InsightHub Vue 3 and Node/Express Sentry guide.
- New CP repository architecture, security, testing, OpenAPI, IAM, and AI-workflow
  controls in this repository.

The two company documents are reference material, not New CP requirements. Their
Vue, Node, production hosts, project IDs, DSNs, user names, URLs, and file paths
are not copied into this repository.

## Practices transferred

1. Use one integration boundary per provider; application code must not import an
   SDK directly from arbitrary components.
2. Keep both providers disabled by default and protect initialization with an
   explicit environment kill-switch.
3. Use deliberate PostHog events instead of autocapture and default SDK pageviews.
4. Keep event names and properties stable, action-oriented, and `snake_case`.
5. Identify users only with an approved stable identifier; email is opt-in and
   must remain disabled by default.
6. Mask inputs and exclude passwords, tokens, PHI, customer data, and sensitive
   financial values from analytics and replay.
7. Use Sentry for unexpected errors and bounded performance context; do not send
   every log line or expected validation/authorization failure.
8. Add route/module context, correlation IDs, and bounded breadcrumbs without
   copying request bodies or secrets.
9. Verify in a non-production environment first and attach sanitized evidence.

## Practices intentionally not transferred

- Vue-specific files, composables, stores, and templates.
- Node/Express backend initialization, middleware, CORS changes, cron tracing,
  PM2/SSH commands, and server environment variables. This repository is the
  React Option A frontend; backend observability requires a separate approved
  backend task and owner.
- Company-specific production URLs, organization/project identifiers, DSNs,
  email aliases, and deployment commands.
- Company-specific event names when the equivalent New CP route or business action
  has not been approved.
- Automatic session replay or feature flags without privacy/product approval.

## New CP adaptation

The target integration is frontend-only and must respect the current repository:

- React + TypeScript + Vite, not Vue.
- Existing router, authentication/IAM boundary, OpenAPI client boundary, mock
  mode, and `VITE_ENABLE_TELEMETRY` gate remain authoritative.
- The backend is not available in this repository. Sentry distributed tracing
  headers and server-side error handling are documented as a future coordination
  dependency, not implemented here.
- PostHog and Sentry SDK dependencies are not added by this documentation PR.
  A later implementation task must justify versions, update the lockfile, and
  provide tests.
- No real telemetry is enabled by this PR. `MOCK`, `NOT VERIFIED`, and
  `BLOCKED` must be used until the provider projects, privacy approval, safe test
  identity, and runtime evidence exist.

## Decisions still requiring human approval

- Provider account/project ownership and data region.
- Whether session replay is permitted for this clinical application and which
  regions must be masked or excluded.
- Whether email may ever be sent to either provider.
- The approved New CP event taxonomy and retention period.
- Production sampling rates, alert owners, source-map policy, and release naming.
- Backend Sentry ownership and the CORS/trace-header contract when the backend is
  available.
