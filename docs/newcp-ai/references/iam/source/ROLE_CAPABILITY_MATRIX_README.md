# How to use ROLE_CAPABILITY_MATRIX.csv with granular IAM roles

The CS/OPS/FINANCE/QC/ADMIN columns in `ROLE_CAPABILITY_MATRIX.csv` encode **approved high-level access-family envelopes**, not a claim that the V3 database has only five rows in `iam.roles`, and not a comprehensive permission profile for every Junior/Senior grade.

- Map legacy and currently seeded V3 IAM granular role codes using `INTERNAL_ROLE_HIERARCHY_MAPPING_TEMPLATE.csv`.
- Populate each actual role's **explicit approved** capabilities; the transitive same-family inheritance RULE is approved, while real hierarchy EDGES and direct grants must be source-verified before seeding.
- `OPS=S` limits to Models/Conversion service types. It must not automatically give Junior Ops every OPS capability just because it is part of that family.
- `REPORT` means report read only in Finance/QC operational records; read all reports allowed for every family, exports Finance/QC/Admin only.
- A user's effective permissions are a union of assigned roles’ own grants and mandatory transitive child grants across verified same-family role links; mandatory tenant/business guards still apply.
- Google Group membership and `groups` claims are not authorization inputs.
- Current V3 V006 has no explicit role inheritance table. A flattened effective-capability projection can implement the approved hierarchy for demo, if backed by evidenced role links and timely invalidation; do not skip inheritance or invent edges.

