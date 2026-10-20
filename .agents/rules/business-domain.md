---
trigger: always_on
description: Apply the 3DDX business-domain model and invariants before planning, changing, or reviewing product behavior.
---

# 3DDX Business Domain Rule

This is the concise, always-on business context derived from the canonical guide:
`H:\3DDX\02 Backend\New DB V3\03 BUSINESS_GUIDE.html`.

The source guide remains the authority for detailed wording and unresolved decisions. This rule prevents common business misunderstandings; it does not authorize inventing missing requirements.

## Business purpose

3DDX provides guided implant surgery and related dental services. The flagship physical product is a patient-specific surgical guide, but the system must not be designed as a guide-only system. Reports, conversions, model work, treatment plans, restorations, iSmile, vouchers, licences, kits, shipping, finance, and customer support are first-class business areas.

## Core business model

- An account/client is not the same as a patient. Account types include Doctor, Scanner, Company, Lab, and Other; account type affects visibility, pricing, billing, and permissions.
- A patient is never the customer and is never billed. In the target model, use a pseudonymous `patient_code`; identity data is separate, access-logged, and purpose-controlled.
- The hierarchy is `Account -> Case -> Order -> Service line/order item`.
- A case represents one patient and one clinical intent. An order is a submission belonging to one case. Split double-arch orders may belong to one case only when the pairing evidence is unambiguous or a person accepts it; never merge historical orders by guess.
- An order is a container. Billable service lines live inside it and may include conversion, treatment plan, surgical guide, report, restoration, iSmile stages, and other services.
- Service lines are independently priced, scheduled, staffed, owned, locked, charged, and progressed. Never use one global order status to represent all service-line workflows.
- Same-type service instances must have independent identities, updates, statuses, history, files, and reporting.
- Files may serve multiple service lines. Field values, status history, charges, and audit history are domain data, not UI-only state.

## Clinical and production invariants

- A guided case normally follows intake, scan/conversion, physical model intake, registration, treatment planning, approval, sleeve design, QC, guide design, printing, post-processing/final QC, shipping, and charging.
- Nothing physical is manufactured before the doctor's approval. Approval may be a confirmation email, portal action, or recorded verbal approval during fine-tuning.
- Guide support determines the registration gate: tooth-supported requires STL registration; tissue-supported requires dual-scan registration; bone-supported requires neither. A pre-positioning guide (PPG) makes registration mandatory again.
- Registration verdicts are domain behavior: Option 1 and 2 may proceed; Option 2 requires the appropriate client communication; Option 3 holds the case, presents findings/options, and raises a customer-support task; Option 4 holds the case and does not upload the file downstream.
- A default fine-tuning session may be skipped only through an approved account special request or per-case override. A ready plan is required before scheduling a session.
- Digital delivery is different from manufacturing: an in-house client may receive a designed STL, ending at `Done` without Boston printing or shipping and using digital pricing.
- Redos are separate business outcomes. A redo is excluded from revenue reporting; radiologist-payment exclusion is a separate flag. Do not silently treat a redo as a normal sale.
- Physical work matters: receiving, scanning, printing, QC, packing, shipping, archived packages, bins, loaner kits, consumables, and batch records require traceable ownership and history.

## Money and service rules

- Pricing is per client, service option, currency, and delivery mode. Do not assume one global price list.
- The billed client may differ from the submitting account, such as a scanning centre submitting for a doctor. Changing the payer is constrained by charge state and requires voucher re-evaluation.
- Vouchers are prepaid credit represented by an append-only transaction ledger. Do not edit/delete movements or calculate a balance from a single mutable field.
- Voucher consumption order is defined by the business: general first, then oldest first, with case/additional/original credit ordering as specified by the guide. Do not invent a different ordering.
- Charging eligibility requires a closed service/order with no charge timestamp; the account's charging schedule then controls timing.
- Price changes after charging require a reasoned extra-charge or refund path and an automatic history record.

## Customer support, permissions, and notifications

- Customer Support works from generated tasks, not a generic case queue. Tasks have trigger-specific due dates; due dates may move only forward, with a configured reason and an audit trail.
- Account suspension removes orders from workflow views without deleting them; unsuspension restores them.
- Standing special requests are department-scoped, must be acknowledged when work is locked, and changes notify the relevant department and account history.
- Notifications are event/state/transition-driven and configuration-based. Check suppression, recipient, channel, and template rules before adding ad-hoc email behavior.
- Authorization is not just a visible button. Respect tenant scope, account visibility, staff role, protected routes, and server-enforced permissions when the approved contract exists.

## Status and integration safeguards

- Status codes are per service line/product workflow. The same integer can mean different states for different lines; never create one global status decoder.
- Use the approved OpenAPI contract when available. Never infer endpoint behavior, schemas, permissions, or transitions from mock data or legacy Swagger.
- Keep mock/fixture behavior explicitly simulated. Do not present it as live backend integration.
- Do not connect the frontend directly to PostgreSQL or expose patient identity data through ordinary application/reporting paths.
- Relu AI planning, uploads, notifications, Final AoX, FMP/GFMP, iSmile, vouchers, and integrations have their own state/decision rules. Read the source guide and approved contracts before changing them.
- Preserve unresolved business decisions as blockers or explicit proposals. In particular, do not decide open FMP/GFMP semantics, ambiguous AI states, historical case pairing, or ownership rules by assumption.

## Required behavior for every task

- Before planning a behavior change, identify the affected business entity, service line, workflow state, actor/owner, permission boundary, charge/audit effect, and source requirement.
- Test success, invalid, boundary, hold, approval, failure, and permission paths when applicable.
- When the UI conflicts with this business model or the source guide, stop and report the conflict; do not make the UI's current behavior the business truth.
- Keep Abdo's individual boundary unchanged: Full Stack 5 hours as written, React UI Option A only, and no MUI implementation or comparison-spike ownership.
