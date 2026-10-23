"""Resolve legacy service-level billed parties without guessing.

Finding F07: the legacy ``ToBeBilled``/``toBeBilled`` value is a payer
selection for a service instance.  It is not the same thing as whether the
line is billable.  This module discovers the payer column in every service
family, validates an owner-approved value-domain policy before stage 30 writes
anything, and resolves each item to a migrated ``crm.contacts`` id.

The policy is deliberately external to the code because the static V3 source
does not prove the legacy value encoding.  A new dump whose distinct values are
not covered by the policy stops the authoritative run.
"""
from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from etl_core import EtlError, table_exists


SERVICE_TABLES = (
    "OrderSG",
    "OrderTP",
    "OrderRep",
    "OrderAppliance",
    "OrderSim",
    "OrderRestoration",
    "OrderSoftware",
    "OrderMisc",
    "OrderOther",
    "SubOrderServices",
    "IsmileOrder",
    "IsmileSubOrder",
)

CANDIDATE_COLUMNS = ("ToBeBilled", "toBeBilled")
ALLOWED_SELECTOR_MEANINGS = {"doctor", "scanning_center", "order_default"}
ALLOWED_MODES = {"selector", "legacy_account_id"}


def _raw_key(value: Any) -> str:
    """Stable policy key for the scalar values returned by MySQL."""
    if isinstance(value, bytes):
        value = value.decode("utf-8", errors="strict")
    if isinstance(value, bool):
        return "1" if value else "0"
    return str(value).strip()


def _table_columns(my, table: str) -> list[str]:
    cur = my.cursor()
    cur.execute(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema = DATABASE() AND table_name = %s ORDER BY ordinal_position",
        (table,),
    )
    out = [row[0] for row in cur.fetchall()]
    cur.close()
    return out


def discover_columns(my) -> dict[str, str | None]:
    """Find the exact-cased payer column in every present service table."""
    found: dict[str, str | None] = {}
    wanted = {name.casefold() for name in CANDIDATE_COLUMNS}
    for table in SERVICE_TABLES:
        if not table_exists(my, table):
            continue
        matches = [name for name in _table_columns(my, table) if name.casefold() in wanted]
        if len(matches) > 1:
            raise EtlError(
                f"F07: {table} has several billed-party candidates {matches}; "
                "the source owner must select one explicitly"
            )
        found[table] = matches[0] if matches else None
    return found


def profile_source(my, columns: dict[str, str | None] | None = None) -> dict:
    """Return a PHI-free profile of each source payer value and its row count."""
    columns = columns or discover_columns(my)
    tables: dict[str, dict] = {}
    for table in SERVICE_TABLES:
        if table not in columns:
            continue
        column = columns[table]
        entry: dict[str, Any] = {"column": column, "values": []}
        if column:
            cur = my.cursor()
            cur.execute(
                f"SELECT `{column}`, COUNT(*) FROM `{table}` "
                f"GROUP BY `{column}` ORDER BY COUNT(*) DESC, `{column}`"
            )
            for raw, count in cur.fetchall():
                entry["values"].append(
                    {"raw": None if raw is None else _raw_key(raw), "count": int(count)}
                )
            cur.close()
        tables[table] = entry

    domain = {
        table: {
            "column": entry["column"],
            "values": sorted(
                value["raw"]
                for value in entry["values"]
                if value["raw"] not in (None, "")
            ),
        }
        for table, entry in tables.items()
    }
    encoded = json.dumps(domain, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return {
        "source_domain_sha256": hashlib.sha256(encoded).hexdigest(),
        "tables": tables,
    }


@dataclass(frozen=True)
class PayerContext:
    """Contacts available on the legacy order that owns one service item."""

    order_default_contact_id: int
    doctor_contact_id: int | None
    scan_center_contact_id: int | None


@dataclass(frozen=True)
class Resolution:
    contact_id: int
    origin: str
    evidence: dict[str, Any]


class BilledPartyResolver:
    """Preflight and resolve billed parties for every migrated order item."""

    def __init__(self, my, contact_map: dict[str, int], policy_path: str | None = None):
        self.columns = discover_columns(my)
        self.profile = profile_source(my, self.columns)
        self.contact_map = contact_map
        self.policy_path = policy_path or os.environ.get("ETL_BILLED_PARTY_POLICY")
        self.policy = self._load_and_validate_policy()
        self.policy_version = self.policy.get("policy_version") or "no-explicit-source-values"

    def _load_and_validate_policy(self) -> dict:
        has_values = any(
            value["raw"] not in (None, "")
            for entry in self.profile["tables"].values()
            for value in entry["values"]
        )
        if not self.policy_path:
            if has_values:
                raise EtlError(
                    "F07: legacy service billed-party values exist, but "
                    "ETL_BILLED_PARTY_POLICY is not set. Run profile_billed_party.py, "
                    "approve the value meanings, and point the ETL at that JSON file."
                )
            return {"policy_version": "no-explicit-source-values", "tables": {}}

        path = Path(self.policy_path)
        if not path.is_file():
            raise EtlError(f"F07: billed-party policy does not exist: {path}")
        try:
            policy = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise EtlError(f"F07: cannot read billed-party policy {path}: {exc}") from exc

        version = policy.get("policy_version")
        if not version or str(version).startswith("__"):
            raise EtlError("F07: policy_version must identify the approved mapping decision")
        if policy.get("source_domain_sha256") != self.profile["source_domain_sha256"]:
            raise EtlError(
                "F07: the billed-party policy was approved for a different source value domain; "
                "re-profile this MySQL dump and review any new or removed values"
            )

        table_policy = policy.get("tables") or {}
        for table, source in self.profile["tables"].items():
            column = source["column"]
            nonblank = {
                value["raw"]
                for value in source["values"]
                if value["raw"] not in (None, "")
            }
            if not column or not nonblank:
                continue
            spec = table_policy.get(table)
            if not spec:
                raise EtlError(f"F07: policy has no entry for {table}.{column}")
            if str(spec.get("column", "")).casefold() != column.casefold():
                raise EtlError(
                    f"F07: policy column for {table} is {spec.get('column')!r}; "
                    f"the dump contains {column!r}"
                )
            mode = spec.get("mode")
            if mode not in ALLOWED_MODES:
                raise EtlError(f"F07: {table} policy mode must be one of {sorted(ALLOWED_MODES)}")
            if mode == "selector":
                meanings = spec.get("values") or {}
                missing = sorted(nonblank - set(meanings))
                invalid = sorted(
                    f"{raw}={meaning}"
                    for raw, meaning in meanings.items()
                    if meaning not in ALLOWED_SELECTOR_MEANINGS
                )
                if missing:
                    raise EtlError(f"F07: {table} policy does not map values {missing}")
                if invalid:
                    raise EtlError(f"F07: {table} policy has invalid meanings {invalid}")
            else:
                bad_ids = []
                missing_contacts = []
                for raw in sorted(nonblank):
                    try:
                        legacy_account_id = int(raw)
                    except ValueError:
                        bad_ids.append(raw)
                        continue
                    if str(legacy_account_id) not in self.contact_map:
                        missing_contacts.append(raw)
                if bad_ids:
                    raise EtlError(
                        f"F07: {table} legacy_account_id policy found non-numeric values {bad_ids}"
                    )
                if missing_contacts:
                    raise EtlError(
                        f"F07: {table} payer accounts have no migrated contacts {missing_contacts}"
                    )
        return policy

    def column_for(self, table: str) -> str | None:
        return self.columns.get(table)

    def select_expr(self, table: str) -> str:
        column = self.column_for(table)
        return f"`{column}` AS `__billed_party_raw`" if column else "NULL AS `__billed_party_raw`"

    def resolve(
        self,
        table: str,
        raw_value: Any,
        parties: PayerContext,
        *,
        legacy_id: int | None,
        legacy_key: str | None = None,
    ) -> Resolution:
        column = self.column_for(table)
        raw = None if raw_value is None else _raw_key(raw_value)
        base = {
            "policy_version": self.policy_version,
            "source_table": table,
            "source_column": column,
            "source_raw_value": raw,
            "legacy_id": legacy_id,
            "legacy_key": legacy_key,
        }

        # A missing/blank source instruction uses the order client once, at
        # item creation. The stored item value is authoritative after that.
        if not column or raw in (None, ""):
            return Resolution(
                parties.order_default_contact_id,
                "order_default",
                {**base, "resolution": "column_absent" if not column else "source_blank",
                 "resolved_role": "order_default"},
            )

        spec = (self.policy.get("tables") or {}).get(table)
        if not spec:  # Defensive; preflight should already have stopped.
            raise EtlError(f"F07: no approved policy for {table}.{column}")
        mode = spec["mode"]
        role: str
        if mode == "legacy_account_id":
            try:
                legacy_account_id = int(raw)
            except ValueError as exc:
                raise EtlError(
                    f"F07: {table} {legacy_id} billed-party value {raw!r} is not a legacy account id"
                ) from exc
            contact_id = self.contact_map.get(str(legacy_account_id))
            role = "legacy_account"
        else:
            role = spec["values"].get(raw)
            if role == "doctor":
                contact_id = parties.doctor_contact_id
            elif role == "scanning_center":
                contact_id = parties.scan_center_contact_id
            elif role == "order_default":
                contact_id = parties.order_default_contact_id
            else:  # Defensive; preflight covers the complete domain.
                raise EtlError(f"F07: {table} {legacy_id} has unmapped billed-party value {raw!r}")

        if contact_id is None:
            raise EtlError(
                f"F07: {table} {legacy_id} selects {role}, but the owning order has no "
                "resolvable contact for that role"
            )
        return Resolution(
            contact_id,
            "legacy_explicit",
            {**base, "resolution": "legacy_explicit", "resolved_role": role},
        )

