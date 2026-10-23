# Task 07 — F07 per-service Bill To vertical slice (Codex)

**Source authority:** `policy/F07_DECISION_AND_RELEASE_GATES.md`; `references/f07/source/review/NewCP_V3_Review_Finding_F07_Service_Level_Billed_Party.md`;
`references/f07/source/migrations/V204__service_level_billed_party.sql`; new draft contract/Drizzle/client under `references/f07/integration/`.

## Scope of generated code
1. Inspect the real backend repo and approved connection/tenant/auth modules. Do NOT run migrations/ETL or invent deployment state.
2. Implement or update read path for eligible billed parties for a given existing order; only Doctor/default and Scanning Center contacts applicable to that order/tenant; expose public UUIDs, not internal BIGINT IDs.
3. Add `billedToContactUuid` to create/patch service-instance DTOs; resolve to `crm.contacts.id` in the same trusted tenant-scoped transaction; let V204 default on new item creation when omitted; never accept provenance from a client.
4. Persist origin appropriately (`user_selected` on explicit clerk payer change; DB/ETL owns legacy/default provenance). Never change an unrelated service or parent order payer. Never call financial charge creation solely to store payer selection.
5. Respect financial lock and security: reject noneligible payer, tenant-crossing, missing contact, unauthorized user, or payer edit after charge/invoice. Verify app and DB layer results. Request fields must not include `tenantId` or `billedPartyOrigin`.
6. Extend both React forms to use same shared contract for Bill To selection; preserve independent UX styles; include full per-service fields and redo/status behavior from prior form evidence.
7. Add unit and contract tests now; run real integration/negative billing tests only after database-owner readiness evidence. Provide PASS/FAIL/BLOCKED with commands and redacted evidence; no unwarranted claims of migration signoff.

## Acceptance
- One order / two service items may have different payers; same-type items also may differ.
- Select and persist a billed party independently from creation onward, before charge; correct provenance.
- Default once to order contact when no choice; later header edits do not implicitly propagate payer.
- API and UI reject cross-tenant or ineligible payer selection; no partial update.
- After charge/invoice, changing billed party is rejected, not silently accepted.
- Charges/vouchers/pricing/invoice grouping read item payer; never use order header except insertion default.

## Gate report expected from Codex
`V204 deployed?`, `billed_to_contact_id NOT NULL after stage90?`, `approved source-domain policy?`, `stage90 reconciliation?`, `downstream finance payer-consistency checks?`, `backend/tests?`, `Option A/B E2E?` — for each state PASS / FAIL / BLOCKED / NOT RUN with evidence reference.
