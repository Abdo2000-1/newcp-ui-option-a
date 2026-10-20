# New CP Definition of Done

This Definition of Done is derived from the package's Definition of Ready/Done and quality checklist. It is a project control proposal until the technical lead confirms the final task baseline.

- [ ] Every committed acceptance criterion has a traceability row and named owner.
- [ ] The change stays within the approved scope; stretch or speculative work is separated.
- [ ] Approved API contract, tenant context, permission, error, and instance-identity behavior are documented.
- [ ] Backend layering and frontend boundaries match the actual repository conventions and approved architecture.
- [ ] Unit/component/integration/contract/E2E/accessibility checks applicable to the change are present or their limitation is documented.
- [ ] Actual lint, typecheck, build, and relevant test commands have run; results are recorded without fabrication.
- [ ] Real PostgreSQL integration proves tenant isolation and repeated same-type independence where applicable.
- [ ] Observability evidence is safe, correlated, and distinguishes expected 4xx from unexpected 5xx.
- [ ] No secrets, PHI, customer data, production credentials, or unsafe telemetry appear in code or evidence.
- [ ] POC integrations have source/version, runtime proof, evidence, owner, limitation, and fallback.
- [ ] The actual diff has an independent review; all high-severity findings are resolved or explicitly accepted by the human owner.
- [ ] Documentation, AI usage, contribution, task breakdown, and handoff records are current.
- [ ] Abdo's Option A scope and MUI exclusion are preserved when the change is his work.
- [ ] Human business/architecture/security/merge approval is recorded before gated action.

This setup task does not satisfy the application Definition of Done. It establishes the controls and records which application evidence is still unavailable.

