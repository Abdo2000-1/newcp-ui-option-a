# IAM Capability Boundaries

The matrix below is an approved business-family envelope, not proof that these exact codes or rows already exist in V3. Actual capability codes and granular roles require source verification.

| Capability | CS | OPS | Finance | QC | Admin | Guard |
| --- | --- | --- | --- | --- | --- | --- |
| Read orders/services | Yes | Models/Conversion scope | Report view | Report view | Yes | Tenant/resource scope |
| Create/update services | Yes | Models/Conversion | No | No | Yes | Workflow and permission guards |
| Status/On Hold | Yes | Models/Conversion | No | No | Yes | `holdType` + `holdReasonCode` atomically |
| Price override | Yes | Models/Conversion | Yes | No | Yes | `canEditPrice`, financial lock, audit |
| Bill To edit | Yes | Models/Conversion | Yes | No | Yes | F07 gate, eligibility, lock, audit |
| Billability edit | Yes | Models/Conversion | Yes | No | Yes | Independent `isBillable`, lock, audit |
| Zero-charge reason | Yes | Models/Conversion | Yes | No | Yes | Required for new final zero lines |
| View reports | Yes | Yes | Yes | Yes | Yes | Sanitized tenant demo data |
| Export reports | No | No | Yes | Yes | Yes | API must enforce separately |
| Financial transactions | No | No | Yes | No | Yes | Separate financial authorization |
| QC audit | No | No | No | Yes | Yes | Audit scope |
| Assign/revoke roles | No | No | No | No | Yes | Authorized tenant only |
| Cross-tenant admin | No | No | No | No | Separate privilege | Never infer from Admin |

Allows are additive across assigned internal roles but remain constrained by tenant, resource, service type, workflow, and financial rules. Unlisted capabilities are denied.
