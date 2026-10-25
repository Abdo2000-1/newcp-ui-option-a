---
name: api-service-instance-integration
description: Implement a bounded New CP service-instance API slice behind a typed mock/live boundary without inventing backend behavior.
---

# API Service-Instance Integration

Use only after contract analysis and an approved bounded task.

1. Confirm the exact allowed and excluded files.
2. Map every request and response to an operationId/schema in the supplied YAML.
3. Keep UI, use cases, typed ports, transport, mapping, and adapters separate.
4. Preserve independent service-instance UUIDs.
5. Implement ETag/If-Match with honest 412/428 handling.
6. Use available transitions and require atomic holdType/holdReasonCode for On Hold.
7. Preserve backend-derived prices, zero-charge reasons, independent isBillable, and payer/provenance separation.
8. Normalize Problem errors without exposing sensitive data.
9. Use only synthetic fixtures labelled `MOCK / NOT_INTEGRATED` until a live target is approved.
10. Run actual checks, inspect the diff, report skipped live checks, and create one PR for one bounded task.

Stop for missing contract/runtime/owner decisions. Do not add database access, migrations, ETL, credentials, production URLs, live F07 writes, or unapproved dependencies. Human review and merge approval remain required.
