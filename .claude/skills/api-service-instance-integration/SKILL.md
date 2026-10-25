---
name: api-service-instance-integration
description: Implement a bounded New CP service-instance API slice behind a typed mock/live boundary without inventing backend behavior.
---

# API Service-Instance Integration

Use only after contract analysis and an approved bounded task. Read the API reference, integration architecture, business policy, actual `src/shared/api/`, affected features, and tests first.

Map every request and response to an operationId/schema. Keep UI, use cases, typed ports, transport, mapping, and adapters separate. Preserve independent service-instance UUIDs; implement ETag/If-Match with 412/428 handling; use available transitions; require atomic holdType/holdReasonCode for On Hold; preserve backend-derived pricing, zero-charge reasons, independent isBillable, and payer/provenance separation. Normalize Problem errors without sensitive data. Use only labelled synthetic mocks until an approved live target exists.

Stop for missing contract/runtime/owner decisions. Do not add database access, migrations, ETL, credentials, production URLs, live F07 writes, or unapproved dependencies. Complete only when the bounded files, tests, actual checks, evidence, and MOCK/INTEGRATED status are honest and human merge approval remains pending.
