# Conventions and Repository Compatibility

## Current status

No application formatter, linter, TypeScript configuration, package manager, Git workflow, or naming convention was available at the inspected root. The rules below are documentation conventions and proposed defaults only; implementation repositories must be checked before adopting them.

## Documentation conventions

- Use UTF-8 Markdown with one H1 and descriptive headings.
- Use repository-relative paths in links and exact source filenames in traceability records.
- Use status labels consistently: `Not started`, `Planned`, `In progress`, `Verified`, `Blocked`, `Not applicable`.
- Mark proposals, assumptions, and open questions explicitly.
- Do not record secrets, PHI, customer data, production identifiers, or unsanitized screenshots.

## Expected implementation conventions to verify later

- Preserve the actual package manager and lockfile.
- Preserve existing formatter/linter configuration; do not introduce a second formatter.
- Use strict TypeScript only where the approved repository already supports it or the lead approves enabling it.
- Keep imports directional and avoid circular dependencies.
- Name modules after domain responsibilities rather than UI appearance alone.
- Keep public API types aligned to the canonical OpenAPI contract; do not maintain an unreviewed duplicate contract.
- Use feature-local tests near the repository's established test locations.

## Git and review conventions

The source package proposes protected default branches, feature branches, pull requests, at least one reviewer, and evidence-linked checks. Hosting was not verifiable here, so no provider-specific workflow was created. When the host is confirmed, record branch protection, reviewer routing, required checks, and release-tag policy in the implementation repository.

