# PostHog and Sentry Provider Activation Guide

## Overview & Current Runtime Status

The New CP React Option A repository is **provider-ready**:
- The official browser SDKs (`posthog-js` and `@sentry/react`) are installed in `package.json`.
- Central adapters (`PostHogAdapter` and `SentryAdapter`) are wired with strict privacy boundaries, data sanitization, expected-domain error filtering, and complete runtime failure isolation.
- Both providers are **disabled by default**.
- **No real keys, DSNs, tokens, or credentials exist in this repository.**
- Status: `NOT VERIFIED` / `BLOCKED` for live external provider traffic until the senior engineer supplies the approved values below.

---

## 1. Required Senior Engineer Configuration Values

### PostHog Configuration

The senior engineer must configure the following values in the deployment environment / secrets store:

| Variable | Target Location | Description & Approval Requirements |
| :--- | :--- | :--- |
| `VITE_ENABLE_TELEMETRY` | CI/CD Secrets / Hosting Env | Master kill-switch. Must be set to `true` to allow any provider to run. Default: `false`. |
| `VITE_POSTHOG_ENABLED` | CI/CD Secrets / Hosting Env | PostHog provider kill-switch. Set to `true` once project is provisioned. Default: `false`. |
| `VITE_POSTHOG_KEY` | CI/CD Secrets / Hosting Env | **Project API Key** (e.g. `phc_...`). Must be provisioned in the approved company PostHog organization. |
| `VITE_POSTHOG_HOST` | CI/CD Secrets / Hosting Env | **Ingest Host / Region**. Default: `https://us.i.posthog.com` or `https://eu.i.posthog.com` per company data residency compliance. |
| `VITE_POSTHOG_CAPTURE_IN_DEV` | Local developer `.env` only | Allows local event emission for testing. Must remain `false` in production. |
| `VITE_POSTHOG_TRACK_EMAIL` | CI/CD Secrets / Hosting Env | Default: `false`. Must remain `false` unless explicitly approved by privacy/compliance. |

#### PostHog Event Approval
Before activating live PostHog capture, verify that only the 9 approved low-volume canonical events defined in [`telemetry-event-contract.md`](./telemetry-event-contract.md) are emitted:
1. `page_view` (Central router transition only)
2. `user_logged_in` (Post-IAM login confirmation)
3. `user_logged_out` (Session termination and identity reset)
4. `navigation_clicked` (Primary navigation actions)
5. `report_opened` (Report entry)
6. `report_filtered` (Meaningful filter actions)
7. `report_exported` (Report export)
8. `workflow_action_completed` (Approved clinical workflow transition)
9. `feature_flag_variant_seen` (Approved feature flag evaluation)

*Autocapture, default SDK automatic pageviews, and session recording are hard-coded to `false`/disabled.*

---

### Sentry Configuration

The senior engineer must configure the following values in the deployment environment / secrets store:

| Variable | Target Location | Description & Approval Requirements |
| :--- | :--- | :--- |
| `VITE_SENTRY_ENABLED` | CI/CD Secrets / Hosting Env | Sentry provider kill-switch. Set to `true` once project is provisioned. Default: `false`. |
| `VITE_SENTRY_DSN` | CI/CD Secrets / Hosting Env | **Frontend Project DSN** (e.g. `https://<key>@<org>.ingest.sentry.io/<project>`). |
| `VITE_SENTRY_ENVIRONMENT` | CI/CD Secrets / Hosting Env | Target environment name (`staging`, `production`, `development`). |
| `VITE_SENTRY_RELEASE` | CI/CD Build Step | Release version identifier (e.g. `newcp-ui-option-a@4.2.0-git-<sha>`). |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | CI/CD Secrets / Hosting Env | Performance trace sample rate. Default: `0.0`. Requires senior engineer approval for non-zero values. |
| `VITE_SENTRY_TRACK_EMAIL` | CI/CD Secrets / Hosting Env | Default: `false`. Excludes emails from Sentry user context and breadcrumbs. |
| `VITE_SENTRY_SOURCE_MAPS` | CI/CD Build Step | Set to `true` during CI release builds to generate hidden `.map` files for artifact upload. |
| `SENTRY_AUTH_TOKEN` | CI/CD Secrets (GitHub Actions) | Sentry auth token with `project:releases` scope for source-map uploading. Never committed to git. |
| `SENTRY_ORG` | CI/CD Secrets / Hosting Env | Company Sentry organization slug. |
| `SENTRY_PROJECT` | CI/CD Secrets / Hosting Env | Frontend Sentry project name (`newcp-frontend`). |

---

## 2. Provider Activation Checklist

Follow this systematic procedure when activating PostHog and Sentry in a target environment:

### Phase A: Local Activation (Safe Sandbox)
- [ ] Create a local `.env.local` (ignored by git).
- [ ] Set `VITE_ENABLE_TELEMETRY=true`.
- [ ] Set `VITE_POSTHOG_ENABLED=true` and `VITE_POSTHOG_KEY=<test-dev-key>`.
- [ ] Set `VITE_POSTHOG_CAPTURE_IN_DEV=true`.
- [ ] Set `VITE_SENTRY_ENABLED=true` and `VITE_SENTRY_DSN=<test-dev-dsn>`.
- [ ] Launch application locally with `npm run dev`.
- [ ] Check runtime diagnostics: `getObservabilityDiagnostics()` must return `status: "enabled_initialized"`.

### Phase B: Staging Activation
- [ ] Add approved staging keys to GitHub Actions / hosting environment secrets.
- [ ] Trigger deployment to staging environment.
- [ ] Confirm staging builds complete without errors and that source-maps are generated as hidden artifacts if enabled.

### Phase C: Verification Event (PostHog)
- [ ] Authenticate with an approved test operator (e.g. `cs.demo@3ddx.com`).
- [ ] Navigate to `/flow` or `/quarter-targets`.
- [ ] Inspect PostHog staging dashboard:
  - Verify that `page_view` and `user_logged_in` appear with opaque `user_id` (`usr-cs-001`).
  - Verify that query strings, tokens, and PHI are **absent** from event properties.
- [ ] Log out from the application.
  - Verify that `user_logged_out` is captured and that subsequent actions have no identified distinct ID.

### Phase D: Verification Error (Sentry)
- [ ] Trigger a test uncaught component error using the test error trigger or deliberate sandbox action.
- [ ] Verify that `ErrorBoundary` catches the exception and renders the clinical fallback without crashing the shell.
- [ ] Inspect Sentry staging dashboard:
  - Confirm the exception appears tagged with `environment: "staging"` and `component: "ErrorBoundary"`.
  - Confirm `sendDefaultPii: false` was respected (no IP, no cookie, no auth header).
  - Confirm expected domain errors (401, 403, 404, 409, 412, 422, 428) are **filtered** and do not generate unhandled crash issues.

### Phase E: Privacy & PHI Compliance Review
- [ ] Verify that no patient names, clinician notes, patient IDs, or scan URLs appear in breadcrumbs or tags.
- [ ] Verify that authorization headers (`Bearer ...`) and tokens are completely scrubbed.
- [ ] Verify that session recording is completely disabled.

### Phase F: Deployment Validation
- [ ] Validate that provider latency or blocked network requests (e.g. via ad-blocker) do **not** slow down or interrupt clinical flows.
- [ ] Confirm that `npm run build` succeeds and assets bundle without leaking development keys.

### Phase G: Rollback / Instant Disable Procedure
If any unexpected telemetry issue, privacy concern, or event surge occurs:
1. Set `VITE_ENABLE_TELEMETRY=false` in the hosting environment variables (or secrets).
2. Redeploy or restart the container/hosting process.
3. The application immediately reverts to `NoopPostHogAdapter` and `NoopSentryAdapter` without any code changes or redeployment of application logic.
