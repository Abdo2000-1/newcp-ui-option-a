---
name: groom-task
description: Turn an approved plan into small ordered implementation steps with dependencies, tests, evidence, and explicit exit criteria. Use before implementation begins.
---

# Groom Task

## Purpose

Make an approved plan executable without silently changing its scope.

## Required inputs

- Approved `plan-task` output.
- Requirement/traceability rows and acceptance criteria.
- Actual repository paths, existing conventions, API contract, test tools, and owner/reviewer assignments.

## Workflow

1. Re-read the plan and source requirements; flag any mismatch before decomposing it.
2. Split work into ordered, reviewable steps with one clear outcome each.
3. Map each step to exact files/modules, dependencies, tests, evidence, owner, reviewer, and estimated effort if the approved allocation supplies it.
4. Identify parallel work only where it does not create contract or data-integrity races.
5. Separate blocking questions from non-blocking follow-ups and assign decision owners.
6. Define a safe fallback or reduced scope for each material risk.

## Output

Produce an actionable breakdown suitable for the developer task template, including step IDs, order, files, dependencies, success criteria, verification, evidence, reviewer, and stop conditions.

## Constraints and stop conditions

Do not add unapproved features, dependencies, architecture, endpoints, or ownership. Stop if the plan is not approved, the contract is missing, or any step cannot be verified.

## Completion gate

Every step has explicit completion criteria and a verification method; all blockers have owners and requested decisions. Next stage: `implement-task` only after plan/groom approval.

