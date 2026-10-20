# Engineering Guidelines

These guidelines apply to future implementation repositories after their actual conventions are inspected. They are proposed controls derived from the selected package and must not override approved repository-specific practices.

## Change isolation

- Start from a traced requirement and an approved plan.
- Keep changes small and reversible; do not mix feature work with broad refactoring.
- Preserve existing tooling and behavior unless a change is required and verified.
- Escalate changes to business semantics, V3 schema, public API, authentication, tenant boundaries, or mandatory gates.

## Separation of concerns

- Keep transport, domain rules, data access, integrations, and presentation distinct.
- Avoid direct database access from Express routes or frontend code.
- Map external DTOs explicitly; do not expose database rows by default.
- Prefer feature-local modules when behavior is feature-specific; use shared modules only for verified cross-feature behavior.

## Validation and errors

- Validate configuration and untrusted input at the boundary with the repository's approved tools; backend validation is authoritative.
- Normalize errors to approved status/code/message/correlation-ID conventions.
- Do not return raw SQL errors, stack traces, secrets, PHI, or internal authorization details.
- Invalid or unauthorized mutations must not leave partial business records.
- Handle loading, success, empty, error, unauthorized, and retry states explicitly where the UI supports the flow.

## Data integrity and concurrency

- Use stable service-instance identifiers for updates, transitions, history, and reporting.
- Preserve same-type multiplicity; never reintroduce the legacy per-type uniqueness assumption.
- Define idempotency or retry behavior before implementing a mutation that can be retried.
- Keep status transitions auditable with actor, previous/new state, and time.

## Observability

- Use request/correlation IDs and bounded metric labels.
- Do not put record identifiers, patient/customer data, or secrets into metric labels, cache keys, logs, screenshots, or telemetry.
- Treat expected 4xx and unexpected 5xx separately in demo evidence.

## Human ownership

AI may propose and implement bounded changes, but humans approve business rules, architecture, security/authentication decisions, production operations, and merges. The implementation owner remains accountable for correctness and evidence.

