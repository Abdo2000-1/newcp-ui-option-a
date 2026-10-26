# PostHog Integration Contract — React Option A

## Status and scope

This is a proposed implementation contract derived from the company PostHog
reference and adapted to the actual New CP React/Vite repository. It is not an
implementation claim and does not authorize enabling analytics.

Scope: client-side product analytics and, only after explicit approval, feature
flags or session replay. Backend event ingestion is out of scope for this
frontend repository.

## Required controls

- `VITE_ENABLE_TELEMETRY` must be `true` before any telemetry provider can run.
- A separate PostHog enable flag must default to `false`.
- Missing key, invalid configuration, blocked network, or SDK exception must
  result in a no-op adapter; the app must continue normally.
- `autocapture` must remain disabled.
- SDK pageview capture must remain disabled; route-driven pageviews, if approved,
  are emitted once from the central React router boundary.
- Feature flags must always have a deterministic local fallback.
- Session replay is disabled until product/privacy approval confirms masking and
  exclusion of patient, clinical, financial, password, token, and customer data.

## Safe configuration shape

The repository may expose names in `.env.example` only. Real values belong in
the approved local/CI secret configuration and must never be committed.

| Variable | Safe default | Meaning |
| --- | --- | --- |
| `VITE_POSTHOG_ENABLED` | `false` | Provider kill-switch |
| `VITE_POSTHOG_KEY` | empty | Browser project key; not a secret substitute for access tokens |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` | Provider ingest host; confirm region with owner |
| `VITE_POSTHOG_CAPTURE_IN_DEV` | `false` | Prevents accidental local event traffic |
| `VITE_POSTHOG_TRACK_EMAIL` | `false` | Email is excluded unless explicitly approved |

These values do not prove that a PostHog project exists or that delivery works.

## Identity and privacy

- Use the approved stable application user identifier, preferably the provider
  subject/opaque ID after IAM confirms it. Never use a display name as identity.
- Do not send access tokens, cookies, passwords, authorization headers, PHI,
  patient identifiers, raw clinical notes, financial amounts, or full payloads.
- `tenant_id`, role, and capability values may be used only if the IAM/privacy
  owner approves their analytics use and values are bounded. Frontend telemetry
  must not become an authorization source.
- On logout, reset the analytics identity. Do not carry identity across users on
  a shared browser.

## Proposed event shape

See [telemetry-event-contract.md](./telemetry-event-contract.md). Event names and
properties are proposed until the product/privacy owner approves them. Use
canonical IDs and route/module labels, not display text as a join key. Do not
emit high-frequency events such as every keystroke, scroll, or render.

## Feature flags

Feature flags may be introduced only through an approved task. Every flag must
define a local fallback, owner, expiry/removal date, rollout scope, and a
verification event or documented manual check. The application must render the
safe baseline when PostHog is unavailable.

## Verification evidence

After implementation, evidence must show:

1. Disabled-by-default behavior with no provider network traffic.
2. Enabled non-production delivery using an approved synthetic test identity.
3. Correct identity reset on logout.
4. Correct route/event deduplication.
5. No sensitive values in event payloads or replay.
6. Safe fallback when the provider is blocked or unavailable.

Provider dashboard screenshots or payloads must be sanitized and linked to the
task ID. No production verification is implied by local tests.
