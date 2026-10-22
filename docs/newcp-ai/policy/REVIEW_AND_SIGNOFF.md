# Implementation review checklist (use per PR)

- [ ] Which exact authority applies: New CP confirmed, legacy source, or V3 observed? Source file/path/line included.
- [ ] No fabricated UUIDs, form values, backend rules, prices, status transitions, tenant identities or billing recipients.
- [ ] Connect creation and CP internal-edit field distinctions are preserved; all source-grounded controls including conditional ones are covered.
- [ ] All server-side validations, authorization and tenant scoping have explicit tests; only source-attached Angular validators labelled as client-enforced.
- [ ] Repeated same-type service creation, independent edits/status/history and report counts have tests.
- [ ] Financial locks and intended per-service Bill To are not silently bypassed; blocked behavior is explicit.
- [ ] API contract changes are reviewed with both FE owners before adoption.
- [ ] No unrelated files or dependencies changed; approved POC integration reused.
- [ ] Code format/typecheck/lint/unit/integration/E2E command and observed results listed, unrun steps marked NOT RUN.
- [ ] No tokens, production data, medical/patient records, real user information, PHI or secrets in code/fixtures/logs/AI submissions.
- [ ] Reviewer inspects diff and authorizes commit/merge/deploy separately.
