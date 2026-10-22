#!/usr/bin/env python3
"""Profile legacy service payer columns and emit a policy-review JSON file.

Run this against the exact MySQL dump that will feed the authoritative ETL:

    python3 profile_billed_party.py > billed_party_policy.json

Replace every ``__REVIEW_REQUIRED__`` meaning with ``doctor``,
``scanning_center`` or ``order_default``; set a decision-bearing
``policy_version``; peer review the file; then set ETL_BILLED_PARTY_POLICY to
its path.  The profile contains only table/column names, raw selector values and
counts—no patient or contact data.
"""
from __future__ import annotations

import json

from billed_party import discover_columns, profile_source
from etl_core import mysql_connect


def main() -> int:
    my = mysql_connect()
    try:
        profile = profile_source(my, discover_columns(my))
    finally:
        my.close()

    policy = {
        "policy_version": "__SET_TO_APPROVED_DECISION_ID__",
        "source_domain_sha256": profile["source_domain_sha256"],
        "tables": {},
        "profile": profile["tables"],
    }
    for table, entry in profile["tables"].items():
        column = entry["column"]
        values = sorted(
            {value["raw"] for value in entry["values"] if value["raw"] not in (None, "")}
        )
        if column and values:
            policy["tables"][table] = {
                "column": column,
                "mode": "selector",
                "values": {value: "__REVIEW_REQUIRED__" for value in values},
            }
    print(json.dumps(policy, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

