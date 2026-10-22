#!/usr/bin/env python3
"""Validate the integrated New CP handoff layout without DB or network access."""

from pathlib import Path
import csv
import json


BASE = Path(__file__).resolve().parent.parent

REQUIRED = [
    "references/v06/form_biomodel.json",
    "references/v06/form_conversion.json",
    "references/v06/02_Validation_Rule_Matrix.csv",
    "references/v07/contracts/newcp-demo.openapi.yaml",
    "references/v07/drizzle/v3-demo-scope.schema.ts",
    "references/v07/01_GAPS_AND_DECISIONS.csv",
    "references/v07/mappings/03_READ_ONLY_TENANT_DISCOVERY.sql",
    "policy/STATUS_AND_DECISIONS.md",
    "tasks/00_READ_ONLY_REPOSITORY_PREFLIGHT.md",
    "templates/backend/AGENTS.md",
    "templates/option-a/AGENTS.md",
    "templates/option-b/AGENTS.md",
    "references/project/AAA_New_CP_October_2026_Demo_Meeting_Guide_20261006_V1.2.pdf",
]


def require_files() -> None:
    for relative_path in REQUIRED:
        path = BASE / relative_path
        if not path.is_file():
            raise AssertionError(f"MISSING {relative_path}")


def validate_reference_data() -> None:
    for filename in ("form_biomodel.json", "form_conversion.json", "05_Synthetic_Form_Fixtures.json"):
        json.loads((BASE / "references/v06" / filename).read_text(encoding="utf-8"))

    with (BASE / "references/v07/01_GAPS_AND_DECISIONS.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        blockers = {row["ID"]: row for row in csv.DictReader(handle)}

    for requirement in ("R01", "R02", "R03", "R04", "R07", "R08", "R09", "R10"):
        if requirement not in blockers:
            raise AssertionError(f"MISSING blocker row {requirement}")


def validate_f07_overlay() -> None:
    required_f07 = (
        "policy/F07_DECISION_AND_RELEASE_GATES.md",
        "references/f07/integration/newcp-demo-f07.openapi.yaml",
        "references/f07/integration/v3-demo-f07.schema.ts",
        "tasks/07_F07_PAYER_VERTICAL_SLICE.md",
    )
    for relative_path in required_f07:
        if not (BASE / relative_path).is_file():
            raise AssertionError(f"MISSING F07 resource {relative_path}")


if __name__ == "__main__":
    require_files()
    validate_reference_data()
    validate_f07_overlay()
    print(f"PASS: integrated handoff structure and reference data ({len(REQUIRED)} paths)")
    print("PASS: F07 policy, contract, schema, and task resources present")
