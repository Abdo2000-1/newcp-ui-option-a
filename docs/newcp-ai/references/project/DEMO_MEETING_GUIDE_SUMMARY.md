# October New CP Demo Meeting Guide — Structured Summary

## Source

This summary is derived from `AAA_New_CP_October_2026_Demo_Meeting_Guide_20261006_V1.2.pdf`, copied beside this file. Page references below refer to that PDF. This is a navigation aid for AI-assisted work; the PDF remains the source reference.

## Confirmed context from the guide

- The October objective is an end-to-end New CP demonstration using the new database and validated business data, with visible results rather than unsupported claims. (PDF pp. 1–2)
- Plan A is the minimum demonstration scope. It includes one existing Models service and one existing Conversion service, basic Google login/permissions, reporting with filters/search/counts, service add/edit behavior, one permitted status transition with actor/time/previous/new values, attachments, and monitoring through Prometheus/Grafana. (PDF pp. 2–4)
- Plan B is later or additional scope: more roles, extended reports/export, new-order creation, broader workflow, S3/email, and controlled failure demonstrations. It must not be silently pulled into a Plan A task. (PDF pp. 2–4)
- The business scenario follows a clerk working with existing Demo-M and Demo-C orders, including add/edit/reopen behavior, one transition, reporting/history, and operational metrics. (PDF pp. 3–5)
- Invalid input must be rejected, persistence and status/history must be visible where the real integration is approved, and actual results must be recorded as evidence. (PDF pp. 4–6)
- Frontend responsibilities include report/detail/service forms, validation, loading states, and error states. Backend owns business rules, persistence, transitions, and instrumentation; the business owner validates business behavior. (PDF pp. 5–6)
- The engineering foundation references CI/CD quality controls, SonarQube, Prometheus/Grafana, and RabbitMQ where justified. These references do not authorize adding unavailable infrastructure to a frontend-only task. (PDF pp. 6–7)

## Engineering interpretation for this repository

1. Use the guide to understand the demo scenario and evidence expectations.
2. Use the integrated V0.9 handoff under `docs/newcp-ai/` for the more specific F07 policy, form field sources, API contract references, and task boundaries.
3. Keep Plan A, Option A, and the current frontend baseline separate from later backend/database/authentication work.
4. Treat mock behavior as `MOCK` and live behavior as `INTEGRATED` only when the relevant runtime and approval gates have evidence.
5. When the guide and the handoff differ in specificity, record the difference; do not silently merge them into a new requirement.
