# Local Observability Setup & Verification Guide

## Security Notice

> [!CAUTION]
> **This repository is public.**
> Never commit, push, print, log, or include any real PostHog project keys, Sentry DSNs, auth tokens, passwords, patient data, or Protected Health Information (PHI) anywhere in git or pull requests.
>
> All provider credentials supplied separately by the repository owner are authorized for **local configuration only** via git-ignored local environment files (`.env.local`).

---

## 1. Local Environment Configuration

To enable and test PostHog or Sentry locally, create a `.env.local` file in the repository root. This file is excluded by `.gitignore`.

Use only placeholder values in documentation or examples:

```bash
# Enable global telemetry master kill-switch
VITE_ENABLE_TELEMETRY=true

# PostHog Local Configuration (Disabled by default)
VITE_POSTHOG_ENABLED=true
VITE_POSTHOG_KEY=phc_placeholder_key_here
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_CAPTURE_IN_DEV=true
VITE_POSTHOG_TRACK_EMAIL=false

# Sentry Local Configuration (Disabled by default)
VITE_SENTRY_ENABLED=true
VITE_SENTRY_DSN=https://examplePublicKey@o000000.ingest.sentry.io/0000000
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_RELEASE=newcp-ui-option-a@local
VITE_SENTRY_TRACES_SAMPLE_RATE=0
VITE_SENTRY_TRACK_EMAIL=false
```

### Safety Principles Enforced:
1. **Disabled by Default**: Both providers remain completely disabled if `VITE_ENABLE_TELEMETRY` is `false`, if the provider flag is `false`, or if the key/DSN is missing or blank.
2. **Safe No-Op Fallbacks**: When disabled, all adapter methods (`capture`, `identify`, `captureException`, etc.) resolve as silent no-ops without error.
3. **Autocapture Disabled**: PostHog `autocapture` is hardcoded to `false`. No DOM clicks or form inputs are automatically harvested.
4. **Session Recording Disabled**: PostHog session recording is disabled to protect patient privacy and clinical screen information.
5. **PII Disabled**: Sentry `sendDefaultPii` is hardcoded to `false`. User emails, IP addresses, and authorization headers are never captured.
6. **Error Isolation**: Provider initialization or transport failures are wrapped in defensive try-catch blocks and will never break application rendering or authentication.

---

## 2. Safe Test Verification

To safely verify provider wiring without claiming live delivery:

### Safe PostHog Test Event
Import and invoke `emitSafeTestEvent`:
```typescript
import { emitSafeTestEvent } from '@/shared/observability';

const result = emitSafeTestEvent();
console.log(result);
// {
//   provider: 'posthog',
//   action: 'test_event',
//   status: 'emitted', // or 'no_op_disabled'
//   networkEvidenceClaimed: false,
//   summary: 'Safe test event emitted through PostHog adapter. Live delivery NOT verified without network egress evidence.'
// }
```

### Safe Sentry Test Error
Import and invoke `triggerSafeTestError`:
```typescript
import { triggerSafeTestError } from '@/shared/observability';

const result = triggerSafeTestError({ tags: { source: 'local_verification' } });
console.log(result);
// {
//   provider: 'sentry',
//   action: 'test_error',
//   status: 'emitted', // or 'no_op_disabled'
//   eventId: '...',
//   networkEvidenceClaimed: false,
//   summary: 'Safe test error emitted through Sentry adapter. Live delivery NOT verified without network egress evidence.'
// }
```

> [!NOTE]
> **Network Evidence Rule:** Calling adapter methods or receiving a local test event ID verifies only the internal adapter boundary. **Delivery must never be claimed** without explicit browser DevTools network tab egress confirmation or provider ingest dashboard verification.

---

## 3. Verification Commands

Run the test suite to verify observability adapter boundaries and privacy scrubbing:

```bash
# Run observability specific test suites
npm test -- src/shared/observability

# Run all test suites
npm test

# Verify type safety
npm run build

# Run linter
npm run lint
```
