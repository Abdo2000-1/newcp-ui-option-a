# Telemetry Event Contract

## Authority and status

This is a proposed, bounded telemetry vocabulary. It is derived from the company
reference conventions and New CP's existing routes, reports, authentication, and
workflow boundaries. It is not a new business requirement and must receive
product/privacy approval before runtime emission.

## Common properties

Allowed only when available and approved:

- `environment`: bounded `development`, `staging`, or `production` value.
- `route_name` / `route_path`: normalized route identity; remove query strings.
- `module`: bounded application area.
- `user_id`: opaque approved identifier, never an email by default.
- `tenant_id`: only if approved for telemetry and not used for authorization.
- `correlation_id`: safe request correlation value without secrets.

Never include passwords, tokens, cookies, authorization headers, patient or
customer identifiers, clinical notes, financial amounts, full API payloads, or
free-form sensitive text.

## Proposed low-volume events

| Event | Trigger boundary | Safe properties | Status |
| --- | --- | --- | --- |
| `page_view` | Central router transition | route, module, environment | Proposed |
| `user_logged_in` | Approved auth success | opaque user ID, role only if approved, environment | Proposed |
| `user_logged_out` | Logout completion | opaque user ID, environment | Proposed |
| `navigation_clicked` | Navigation action | bounded navigation key, route, module | Proposed |
| `report_opened` | Report route entry | bounded report key, route, module | Proposed |
| `report_filtered` | Meaningful report filter apply | bounded filter type, report key | Proposed |
| `report_exported` | Successful export action | report key, format | Proposed |
| `workflow_action_completed` | Successful approved workflow action | bounded action key, module | Proposed |
| `feature_flag_variant_seen` | Approved flag evaluation | flag key, bounded variant | Proposed |

Do not emit an event for every render, keystroke, scroll, polling tick, or
failed validation attempt. If an action can contain sensitive values, emit only
the bounded action result and code.

## Sentry metadata relationship

The same `environment`, bounded `module`, and safe correlation ID may correlate
PostHog activity with Sentry issues. The two systems must not share raw payloads,
tokens, or user-sensitive data. PostHog is not an incident log; Sentry is not an
analytics warehouse.

## Approval and change process

Adding an event requires a traced task, owner, purpose, properties, privacy
classification, volume expectation, retention decision, test/evidence procedure,
and removal/expiry condition where applicable. Update this file and the relevant
tests before adding provider calls.
