"""
Stage 30 — orders (threeddx3).

Legacy holds one order header (Orders, ~645,000 rows on the 2026-10-13
snapshot) plus one row per product line in a family table, referenced from
Orders by a column per family:

    Orders.SGID              -> OrderSG           surgical guide
    Orders.TPID              -> OrderTP           treatment plan
    Orders.RepID             -> OrderRep          radiology report
    Orders.ApplianceID       -> OrderAppliance    model work / appliance
    Orders.SimID             -> OrderSim          conversion (simulation)
    Orders.RestorationID     -> OrderRestoration  TEMPORARY restoration
    Orders.finalRestorationID-> OrderRestoration  FINAL restoration (Q21)
    Orders.SoftID            -> OrderSoftware
    Orders.miscID            -> OrderMisc
    Orders.orderOtherID      -> OrderOther        other services
    Orders.IsmileID          -> IsmileOrder -> IsmileSubOrder (1-3 per order)
    Orders.TrnID / orthoID   -> OrderTrn / OrderOrtho   RETIRED (Q21): excluded
    Orders.VrID              -> OrderVoucher      voucher purchase (stage 50)

(The Orders index names `rest`, `soft`, `misc` are not columns — v2 defect 2.)

Third level (Q21): SubOrderServices is the per-service commercial record UNDER
a line, keyed (subOrderID, serviceID, orderTypeID). subOrderID is the id of the
LINE row, not of the order — measured on the 2026-10-13 snapshot:

    orderTypeID 11 (Temp Restoration)  -> OrderRestoration.ID via Orders.RestorationID
    orderTypeID 18 (Final Restoration) -> OrderRestoration.ID via Orders.finalRestorationID
    orderTypeID 17 (Other Services)    -> OrderOther.id via Orders.orderOtherID

5,183 of 5,185 comparable service/restoration pairs were sent within the same
day, while not one Orders row with ID = subOrderID carries a restoration. v2
joined subOrderID to Orders.ID, which attached every service to an unrelated
order. Services therefore hang under their line item (parent_item_id).

Target shape:
    orders.cases          one per order (pairing_method 'single', Q3/U8);
                          created BEFORE the order (orders.case_id NOT NULL)
    orders.orders         one per Orders row; DocID without an account -> the
                          tenant's placeholder contact (U7); orphan ScanID -> NULL
                          + metadata note
    orders.order_items    one per referenced line row (+ one per extra order
                          referencing the same row), restoration temp/final
                          roles, iSmile parent/sub-order hierarchy, services
                          under their line
    orders.case_pairing_candidates   split-arch candidates, all 'pending' (U8)
    audit.migration_exclusions       retired tables, parent-deleted children (Q21)

Every item's metadata carries its legacy workflow coordinates for stage 60/90
(review finding F05): legacy_order_type, legacy_is_digital, legacy_service_id,
legacy_status_id (+ legacy_flow_service_id, the service id OrdersFlow actually
qualifies a flow with, or null).

Card data: Orders and every line table carry PT_CC_* columns. Nothing here
selects `*` from them; each query names its columns.

PHI: patient names are read only to build an in-memory hash for case pairing.
They are never logged, stored in evidence, or written by this stage (stage 40
owns clinical.patients / patient_identities and sets orders.patient_id).

Re-runs: an authoritative load starts from an empty database (INTEGRATION_LOG,
orders decision): append-only history and RESTRICT children make a partial
clear impossible, so the stage refuses to run over existing stage-30 data.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from decimal import Decimal

from billed_party import BilledPartyResolver, PayerContext
from config import DEFAULT_CURRENCY
from etl_core import (
    BatchWriter, EtlError, IdMap, Run, Stage, as_bool, as_date, as_int, as_money,
    as_text, as_ts, clear_by_source, mysql_count, slugify, stream, table_exists,
)
from stage_10_identity import placeholder_contact_id
from status_map import ENUM_STATUS_LABELS, classify_status_label

log = logging.getLogger("etl.30_orders")
STAGE = "30_orders"
Q21 = "Q21 2026-10-12"
PAIRING_VERSION = "etl-v3.0"
# Candidates further apart than this are counted but not written (a review list
# of every same-name pair over a decade is not reviewable). The measurement in
# the log covers the written candidates; the >window count is logged too.
PAIRING_WINDOW_SECONDS = 30 * 86400
# Owner decision D-18 (2026-10-14): a candidate pair is linked automatically into
# one case only when it is unambiguous (neither order has any other candidate)
# and the two orders were created less than 5 minutes apart; every other
# candidate goes to the review list (orders.case_pairing_candidates).
AUTO_PAIR_MAX_GAP_SECONDS = 300
# Line tables default dateSent to this value; it is not a real send time.
SENTINEL_EPOCH = 1377694433


# ---------------------------------------------------------------------------
# Line-table specifications. Every source column is named explicitly (no `*`:
# the PT_CC_* card columns must never be read). The logical->source column
# names are case-exact as the 2026-10-13 DDL declares them.
#
#   refs        [(Orders column, item role, restoration stage)]
#   order_type  OrderTypes / OrdersFlow.OrderType id of the line
#   cols        logical name -> source column (None = the table has none)
#   extra       further columns read for arch or metadata
# ---------------------------------------------------------------------------
_STD = {"status": "StatusId", "cost": "Cost", "digital": None, "designer": None,
        "operator": None, "sales": "SalesAgentId", "redo": "isRedo",
        "closer": "closer", "close_date": "closeDate", "sent": "dateSent",
        "end": "dateEnd", "created": "CreatedAt", "notes": None}

LINE_TABLES = [
    {"table": "OrderSG", "pk": "ID", "refs": [("SGID", "primary", None)], "order_type": 4,
     "cat": "surgical_guide",
     "cols": {**_STD, "digital": "isDigital", "designer": "designer", "operator": "OperatorId"},
     "extra": ["serviceID"]},
    {"table": "OrderTP", "pk": "ID", "refs": [("TPID", "primary", None)], "order_type": 3,
     "cat": "treatment_plan", "cols": dict(_STD),
     "extra": ["Maxilla", "Mandible", "is_ai", "aiFailed"]},
    {"table": "OrderRep", "pk": "ID", "refs": [("RepID", "primary", None)], "order_type": 5,
     "cat": "radiology_report", "cols": dict(_STD), "extra": []},
    # OrderAppliance statuses come from two OrdersFlow families: 1 (Model Work:
    # 1-4, 110) and 10 (intra-oral model work: 90-94); the family is chosen by
    # which flow defines the row's status id (see _appliance_type).
    {"table": "OrderAppliance", "pk": "ID", "refs": [("ApplianceID", "primary", None)],
     "order_type": 1, "cat": "appliance",
     "cols": {**_STD, "operator": "OperatorId"},
     "extra": ["MaxillaType", "MandibleType", "archOfInterest"]},
    {"table": "OrderSim", "pk": "ID", "refs": [("SimID", "primary", None)], "order_type": 2,
     "cat": "simulation", "cols": dict(_STD), "extra": ["Maxilla", "Mandible"]},
    {"table": "OrderRestoration", "pk": "ID",
     "refs": [("RestorationID", "temp_restoration", "temporary"),
              ("finalRestorationID", "final_restoration", "final")],
     "order_type": 11, "cat": "restoration",
     "cols": {**_STD, "designer": "DesignedBy", "operator": "OperatorId"},
     "extra": ["restorationType", "arch_of_interest"]},
    {"table": "OrderSoftware", "pk": "ID", "refs": [("SoftID", "primary", None)], "order_type": 9,
     "cat": "software", "cols": {**_STD, "notes": "notes"}, "extra": []},
    {"table": "OrderMisc", "pk": "ID", "refs": [("miscID", "primary", None)], "order_type": 12,
     "cat": "miscellaneous",
     "cols": {"status": None, "cost": "cost", "digital": None, "designer": None,
              "operator": None, "sales": None, "redo": None, "closer": None,
              "close_date": None, "sent": "dateSent", "end": "dateEnd",
              "created": "CreatedAt", "notes": "Comments"},
     "extra": ["type"]},
    {"table": "OrderOther", "pk": "id", "refs": [("orderOtherID", "primary", None)],
     "order_type": 17, "cat": "other",
     "cols": {k: None for k in _STD}, "extra": ["serviceProvider", "shippedBy"]},
]

# Orders columns that reference a row elsewhere; collected while the orders load
# so no line table needs a join back to Orders.
REF_COLUMNS = ["SGID", "TPID", "RepID", "ApplianceID", "SimID", "RestorationID",
               "finalRestorationID", "SoftID", "miscID", "orderOtherID", "IsmileID",
               "TrnID", "orthoID", "VrID"]

# SubOrderServices.orderTypeID -> (line table, Orders column that references the line,
#                                  item role, restoration stage)
SERVICE_PARENTS = {
    11: ("OrderRestoration", "RestorationID", "temp_restoration", "temporary"),
    18: ("OrderRestoration", "finalRestorationID", "final_restoration", "final"),
    17: ("OrderOther", "orderOtherID", "addon", None),
}

ISMILE_ORDER_TYPE, ISMILE_REFINEMENT_ORDER_TYPE = 14, 16   # OrderTypes ids


class StatusResolver:
    """Decodes a legacy status integer into a canonical status code, and knows
    which OrdersFlow flows exist (OrderType, isDigital, serviceID) -> status ids."""

    def __init__(self, my):
        self.by_key: dict[tuple[int, int, int], str] = {}
        self.by_id: dict[int, str] = {}
        self.by_table: dict[tuple[str, int], str] = {}
        self.flows: dict[tuple[int, int, int | None], set[int]] = defaultdict(set)

        for table, mapping in ENUM_STATUS_LABELS.items():
            for sid, label in mapping.items():
                self.by_table[(table, sid)] = classify_status_label(label)

        if table_exists(my, "OrdersFlow"):
            for r in stream(my, "SELECT ID, Status, OrderType, isDigital, serviceID FROM `OrdersFlow`"):
                sid = as_int(r.get("ID"))
                if sid is None:
                    continue
                ot, dig = as_int(r.get("OrderType")) or 0, as_int(r.get("isDigital")) or 0
                self.by_key[(sid, ot, dig)] = classify_status_label(as_text(r.get("Status")))
                self.flows[(ot, dig, as_int(r.get("serviceID")))].add(sid)

        counts: dict[int, Counter] = defaultdict(Counter)
        for (sid, _ot, _dig), code in self.by_key.items():
            counts[sid][code] += 1
        for sid, per_code in counts.items():
            self.by_id[sid] = per_code.most_common(1)[0][0]
        for (table, sid), code in self.by_table.items():
            self.by_id.setdefault(sid, code)
        log.info("status resolver: %d OrdersFlow keys, %d flows, %d distinct status ids",
                 len(self.by_key), len(self.flows), len(self.by_id))

    def resolve(self, value, order_type=None, is_digital=None,
                table: str | None = None, default: str = "submitted") -> str:
        sid = as_int(value)
        if sid is None:
            return default
        ot, dig = as_int(order_type), as_int(is_digital)
        if ot is not None:
            hit = self.by_key.get((sid, ot, dig or 0))
            if hit is None and dig is not None:
                hit = self.by_key.get((sid, ot, 0))
            if hit:
                return hit
        if table:
            hit = self.by_table.get((table, sid))
            if hit:
                return hit
        return self.by_id.get(sid, default)

    def flow_service(self, ot, dig, sid, svc_hint=None):
        """The serviceID OrdersFlow qualifies this line's flow with, or None.

        svc_hint (a SubOrderServices serviceID) is kept only when a flow exists
        for it. Without a hint, a status id that no unqualified flow of
        (ot, dig) defines but exactly one service-qualified flow does (the GFMR
        statuses 130-141/150 under serviceID 10) resolves to that service."""
        if ot is None:
            return None
        dig = dig or 0
        if svc_hint is not None:
            return svc_hint if (ot, dig, svc_hint) in self.flows else None
        if sid is None or sid in self.flows.get((ot, dig, None), ()):
            return None
        owners = [s for (o, d, s), ids in self.flows.items()
                  if o == ot and d == dig and s is not None and sid in ids]
        return owners[0] if len(owners) == 1 else None


STATUS: StatusResolver | None = None


def map_status(value, order_type=None, is_digital=None, table=None, default="submitted"):
    if STATUS is None:
        return default
    return STATUS.resolve(value, order_type, is_digital, table, default)


class Ctx:
    """Per-run state shared by the steps (no PHI except the name hashes)."""

    def __init__(self):
        self.order_id: dict[int, int] = {}            # Orders.ID -> orders.orders.id
        self.currency: dict[int, str] = {}            # Orders.ID -> currency code
        self.refs: dict[str, dict[int, list[int]]] = {c: defaultdict(list) for c in REF_COLUMNS}
        self.line_no: dict[int, int] = defaultdict(int)  # orders.orders.id -> last line number
        # (line table, line id, Orders.ID) -> orders.order_items.id
        self.line_item: dict[tuple[str, int, int], int] = {}
        self.arch: dict[int, set[str]] = defaultdict(set)  # Orders.ID -> {'maxilla','mandible'}
        # Orders.ID -> (DocID, ScanID, name hash or None, epoch or None, time source, is_voucher)
        self.pair_info: dict[int, tuple] = {}
        self.placeholder_orders: set[int] = set()
        # Orders.ID -> contacts available to resolve a service's own payer.
        # The actual doctor remains distinct from the order default because a
        # scan-centre-owned order can have orders.orders.contact_id = centre.
        self.payer_context: dict[int, PayerContext] = {}
        self.billed_party: BilledPartyResolver | None = None
        # OrderTP.ID -> (is_ai, aiFailed, StatusId) as legacy wrote them
        self.tp_ai: dict[int, tuple] = {}

    def next_line(self, order_pk: int) -> int:
        self.line_no[order_pk] += 1
        return self.line_no[order_pk]


def run(run_ctx: Run, my, pg, ids: IdMap, tid: int) -> None:
    global STATUS
    _refuse_rerun(pg)
    STATUS = StatusResolver(my)
    ctx = Ctx()
    # F07 preflight occurs before stage 30 writes anything. It profiles all
    # service families and rejects a dump whose payer values are not completely
    # covered by the owner-approved policy.
    ctx.billed_party = BilledPartyResolver(
        my, ids.load("UserAcounts", "crm.contacts")
    )
    _projects(run_ctx, my, pg, ids, tid)
    _orders(run_ctx, my, pg, ids, tid, ctx)
    _retired_tables(run_ctx, my, pg, ctx)
    services = _service_index(my)
    _items_from_line_tables(run_ctx, my, pg, ids, tid, ctx, services)
    _items_from_suborders(run_ctx, my, pg, ids, tid, ctx)
    _items_ismile(run_ctx, my, pg, ids, tid, ctx)
    _field_values(run_ctx, my, pg, ids, tid)
    _ai_plans(run_ctx, my, pg, ids, tid, ctx)
    _case_pairing_candidates(run_ctx, pg, ctx)
    _status_history(run_ctx, my, pg, ids, tid)
    _comments(run_ctx, my, pg, ids, tid)
    _locks(run_ctx, my, pg, ids, tid)
    _carts(run_ctx, my, pg, ids, tid)


def _refuse_rerun(pg):
    with pg.cursor() as cur:
        cur.execute("SELECT count(*) AS n FROM orders.orders WHERE legacy_source = 'Orders'")
        n = cur.fetchone()["n"]
    if n:
        raise EtlError(f"orders.orders already holds {n:,} migrated orders. Stage 30 loads "
                       "into an empty orders schema only (append-only history and RESTRICT "
                       "children make a partial clear impossible) — recreate the database.")


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
PROJECT_CODES = {
    1: ("connect",      "Connect"),
    2: ("casexchange",  "CaseXchange"),
    3: ("cp",           "CP (staff control panel)"),
    5: ("ismileon",     "iSmileOn"),
    7: ("connect_plus", "Connect Plus"),
}


def currency_decoder(my, currency_by_legacy):
    """Legacy currency text -> currency code. Orders.Currency is free text
    holding a quoted symbol ('"$"', '""$""', '"€"'), occasionally a numeric id,
    and is often empty; the symbols come from the source `Currency` table."""
    by_symbol, by_name = {}, {}
    if table_exists(my, "Currency"):
        for c in stream(my, "SELECT id, name, symbol FROM `Currency`"):
            code = as_text(c.get("name"))
            if not code:
                continue
            by_name[code.upper()] = code.upper()
            sym = as_text(c.get("symbol"))
            if sym:
                by_symbol[sym] = code.upper()

    def decode(raw):
        s = as_text(raw)
        if not s:
            return None
        s = s.strip().strip('"').strip("'").strip()
        if not s:
            return None
        if s in by_symbol:
            return by_symbol[s]
        if s.upper() in by_name:
            return by_name[s.upper()]
        return currency_by_legacy.get(str(as_int(s)))

    return decode


def _currency_by_legacy(pg) -> dict[str, str]:
    with pg.cursor() as cur:
        cur.execute("SELECT code, legacy_id FROM core.currencies WHERE legacy_id IS NOT NULL")
        return {str(r["legacy_id"]): r["code"] for r in cur.fetchall()}


def _name_hash(raw) -> str | None:
    """Normalised patient name -> sha256 (in memory only). Case, accents,
    punctuation and token order are ignored ('DOE, John' == 'john doe')."""
    s = as_text(raw)
    if not s:
        return None
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").lower()
    tokens = sorted(t for t in re.split(r"[^a-z0-9]+", s) if t)
    if not tokens:
        return None
    return hashlib.sha256(" ".join(tokens).encode()).hexdigest()


def _teeth_arches(*values) -> set[str]:
    """Universal tooth numbers (legacy stores Universal, see stage 40) -> arches:
    1-16 maxilla, 17-32 mandible. Anything else is ignored."""
    out = set()
    for v in values:
        for n in re.findall(r"\d+", as_text(v) or ""):
            n = int(n)
            if 1 <= n <= 16:
                out.add("maxilla")
            elif 17 <= n <= 32:
                out.add("mandible")
    return out


def _epoch_ok(ts) -> bool:
    return ts is not None and ts.year > 1971 and int(ts.timestamp()) != SENTINEL_EPOCH


def _fallback_items(pg, tid, catmap) -> callable:
    """One catch-all sellable item per line family (code legacy_<name>)."""
    cache: dict[str, int] = {}

    def get(code: str, name: str, order_type: int, source: str) -> int:
        if code in cache:
            return cache[code]
        with pg.cursor() as cur:
            cur.execute(
                """INSERT INTO catalog.sellable_items
                       (tenant_id, category_id, item_kind, fulfilment_kind, code, name,
                        pricing_method, legacy_source)
                   VALUES (%s, %s, 'service', 'production', %s, %s, 'fixed', %s)
                   ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
                   RETURNING id""",
                (tid, catmap.get(str(order_type)), code, name, source))
            cache[code] = cur.fetchone()["id"]
        pg.commit()
        return cache[code]
    return get


ITEM_FIELDS = ["order_id", "line_number", "parent_item_id", "item_role", "restoration_stage",
               "sellable_item_id", "status", "currency_code", "billed_to_contact_id",
               "billed_party_origin", "unit_price", "is_billable",
               "is_invoiced", "zero_charge_reason_id", "zero_charge_note",
               "sales_agent_user_id", "commission_amount", "is_digital", "is_redo",
               "rush_type_id", "service_provider_id", "designer_user_id", "operator_user_id",
               "reviewer_user_id", "shipped_by_user_id", "closed_by_user_id", "service_notes",
               "pending_reason", "due_at", "sent_to_production_at", "revised_at",
               "completed_at", "closed_at", "created_at", "created_by_user_id", "metadata",
               "legacy_id", "legacy_key", "legacy_source"]

# item_kind and quantity are fixed for this stage. Build the INSERT from the
# field list so adding the two F07 columns cannot silently shift a positional
# value into the wrong financial column.
_ITEM_COLUMNS = ITEM_FIELDS[:6] + ["item_kind", "quantity"] + ITEM_FIELDS[6:]
_ITEM_VALUES = []
for _column in _ITEM_COLUMNS:
    if _column == "item_kind":
        _ITEM_VALUES.append("'service'")
    elif _column == "quantity":
        _ITEM_VALUES.append("1")
    elif _column == "metadata":
        _ITEM_VALUES.append("%s::jsonb")
    else:
        _ITEM_VALUES.append("%s")
ITEM_SQL = (
    "INSERT INTO orders.order_items (" + ", ".join(_ITEM_COLUMNS) + ") "
    "VALUES (" + ", ".join(_ITEM_VALUES) + ") RETURNING id"
)


def item_row(**kw) -> list:
    """Positional values for ITEM_SQL from keywords; unspecified -> NULL/defaults."""
    kw.setdefault("is_billable", True)
    kw.setdefault("is_invoiced", False)
    kw.setdefault("is_digital", False)
    kw.setdefault("is_redo", False)
    kw.setdefault("unit_price", Decimal("0"))
    kw.setdefault("item_role", "primary")
    if kw.get("billed_to_contact_id") is None:
        raise EtlError("F07: every migrated order item must have a resolved billed party")
    if kw.get("billed_party_origin") not in ("legacy_explicit", "order_default"):
        raise EtlError("F07: every migrated order item must have a valid billed-party origin")
    kw["metadata"] = json.dumps(kw.get("metadata") or {}, default=str)
    kw["created_at"] = kw.get("created_at") or datetime.now(timezone.utc)
    unknown = set(kw) - set(ITEM_FIELDS)
    if unknown:
        raise EtlError(f"item_row: unknown fields {sorted(unknown)}")
    return [kw.get(f) for f in ITEM_FIELDS]


def workflow_meta(ot, dig, svc, sid, flow_svc=None) -> dict:
    """Legacy workflow coordinates for stage 60/90 (F05). Integers or null."""
    return {"legacy_order_type": ot, "legacy_is_digital": 1 if dig else 0,
            "legacy_service_id": svc, "legacy_status_id": sid,
            "legacy_flow_service_id": flow_svc}


def _resolve_billed_party(ctx: Ctx, table: str, row: dict, order_legacy: int,
                          legacy_id: int | None, legacy_key: str | None = None):
    """Resolve one target item's payer and return auditable source evidence."""
    if ctx.billed_party is None:
        raise EtlError("F07: billed-party resolver was not initialised")
    parties = ctx.payer_context.get(order_legacy)
    if parties is None:
        raise EtlError(f"F07: order {order_legacy} has no payer context")
    return ctx.billed_party.resolve(
        table,
        row.get("__billed_party_raw"),
        parties,
        legacy_id=legacy_id,
        legacy_key=legacy_key,
    )


# ---------------------------------------------------------------------------
# projects (as v2)
# ---------------------------------------------------------------------------
def _projects(rc, my, pg, ids, tid):
    with Stage(rc, STAGE, legacy="SourceProjects", target="orders.projects") as st:
        if not table_exists(my, "SourceProjects"):
            st.skip("SourceProjects absent")
            return
        pairs = []
        for r in stream(my, "SELECT id, name FROM `SourceProjects`"):
            st.read()
            legacy = as_int(r.get("id"))
            name = as_text(r.get("name"), 200)
            if legacy is None or not name:
                st.exclude("SourceProjects", "approved_other", legacy_id=legacy,
                           approval_reference="D-29 owner 2026-10-14",
                           details={"why": "placeholder project without id or name"})
                continue
            with pg.cursor() as cur:
                cur.execute(
                    """INSERT INTO orders.projects (tenant_id, code, name, legacy_id, legacy_source)
                       VALUES (%s, %s, %s, %s, 'SourceProjects')
                       ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
                       RETURNING id""",
                    (tid, PROJECT_CODES.get(legacy, (str(legacy),))[0],
                     PROJECT_CODES.get(legacy, (None, name))[1] or name, legacy))
                pairs.append((legacy, cur.fetchone()["id"]))
            st.write()
        pg.commit()
        ids.record_many("SourceProjects", "orders.projects", STAGE + ":projects", rc.run_id, pairs)
        pg.commit()


# ---------------------------------------------------------------------------
# cases + orders
# ---------------------------------------------------------------------------
def _orders(rc, my, pg, ids, tid, ctx: Ctx):
    """Orders -> orders.cases (one per order) + orders.orders.

    Each batch inserts its cases first (RETURNING id) and then its orders with
    case_id. order_number is Orders.ID (review item #3)."""
    cmap = ids.load("UserAcounts", "crm.contacts")
    emap = ids.load("WSacounts", "iam.users")
    pmap = ids.load("SourceProjects", "orders.projects")
    placeholder = placeholder_contact_id(pg, tid)
    decode_currency = currency_decoder(my, _currency_by_legacy(pg))
    log.info("   %s orders to migrate", f"{mysql_count(my, 'Orders'):,}")

    # Named columns only: Orders also carries PT_CC_* card columns.
    sql = """SELECT o.ID, o.ScanID, o.DocID, o.dcmPatientName, o.SurgeryDate,
                    o.dateSent, o.CreatedAt, o.projectId, o.closed, o.closeDate, o.closer,
                    o.Currency AS currency_raw, u.DefaultCurrency AS client_currency,
                    o.clientComment, o.internalComment, o.thirdPartyService,
                    u.isTesting AS testing,
                    o.ImplantsSites, o.crownSites, o.abutmentSites,
                    o.SGID, o.TPID, o.RepID, o.ApplianceID, o.SimID, o.RestorationID,
                    o.finalRestorationID, o.SoftID, o.miscID, o.orderOtherID, o.IsmileID,
                    o.TrnID, o.orthoID, o.VrID
             FROM `Orders` o
             LEFT JOIN `UserAcounts` u ON u.uID = o.DocID
             ORDER BY o.ID"""

    with Stage(rc, STAGE, legacy="Orders", target="orders.cases") as stc, \
         Stage(rc, STAGE, legacy="Orders", target="orders.orders") as st:
        cases = BatchWriter(
            pg, stc,
            """INSERT INTO orders.cases
                   (tenant_id, case_code, contact_id, pairing_method, legacy_id, legacy_source)
               VALUES (%s, %s, %s, 'single', %s, 'Orders:case')
               RETURNING id""",
            returning=True, size=10**9)
        orders = BatchWriter(
            pg, st,
            """INSERT INTO orders.orders
                   (tenant_id, case_id, order_number, contact_id, scan_center_contact_id,
                    patient_id, project_id, status, currency_code,
                    client_comment, internal_comment, is_third_party, is_testing,
                    surgery_date, submitted_at, closed_at, closed_by_user_id,
                    metadata, created_at, legacy_id, legacy_source)
               VALUES (%s, %s, %s, %s, %s, NULL, %s, %s, %s, %s, %s, %s, %s,
                       %s, %s, %s, %s, %s::jsonb, %s, %s, 'Orders')
               RETURNING id""",
            returning=True, size=10**9)
        case_pairs: list[tuple] = []
        pending: list[tuple[int, list]] = []
        counts = Counter()

        def flush():
            if not pending:
                return
            for legacy, values in pending:
                cases.add([tid, f"C-{legacy}", values[1], legacy], key=legacy)
            cases.flush()
            got = dict(cases.pairs)
            case_pairs.extend(cases.pairs)
            cases.pairs.clear()
            for legacy, values in pending:
                case_id = got.get(str(legacy))
                if case_id is None:
                    st.skip(f"order {legacy}: its case row was rejected")
                    continue
                orders.add([tid, case_id] + values, key=legacy)
            orders.flush()
            for k, v in orders.pairs:
                ctx.order_id[int(k)] = v
            ids.record_many("Orders", "orders.orders", STAGE + ":orders", rc.run_id, orders.pairs)
            orders.pairs.clear()
            pg.commit()
            pending.clear()

        for r in stream(my, sql):
            st.read()
            stc.read()
            legacy = as_int(r.get("ID"))
            if legacy is None:
                st.skip("Orders row without ID")
                continue
            for col in REF_COLUMNS:
                ref = as_int(r.get(col))
                if ref:
                    ctx.refs[col][ref].append(legacy)

            meta = {}
            doc = as_int(r.get("DocID"))
            scan = as_int(r.get("ScanID"))
            scan_contact = cmap.get(str(scan)) if scan else None
            doctor_contact = cmap.get(str(doc)) if doc else None
            contact_id = doctor_contact
            if not contact_id and not doc and scan_contact:
                # DocID = 0 with a scanning centre: the centre submitted the case
                # without a doctor account (100,252 orders on 2026-10-14). Legacy
                # shows an order to (DocID = acct OR ScanID = acct), so the centre
                # is the client that owns it.
                contact_id = scan_contact
                meta.update(order_owner="scan_center")
                counts["scan_center_owned"] += 1
            if not contact_id:
                # U7: never skipped — the tenant's "Unknown client" owns it.
                contact_id = placeholder
                meta.update(contact_placeholder=True, legacy_doc_id=doc)
                ctx.placeholder_orders.add(legacy)
                counts["placeholder"] += 1
            if scan and not scan_contact:
                meta.update(scan_center_unresolved=True, legacy_scan_id=scan)
                counts["scan_orphan"] += 1
            ctx.payer_context[legacy] = PayerContext(
                order_default_contact_id=contact_id,
                doctor_contact_id=doctor_contact,
                scan_center_contact_id=scan_contact,
            )

            submitted = as_ts(r.get("dateSent"))
            created_legacy = as_ts(r.get("CreatedAt"))
            created_legacy = created_legacy if _epoch_ok(created_legacy) else None
            closed = as_ts(r.get("closeDate"))
            currency = (decode_currency(r.get("currency_raw"))
                        or decode_currency(r.get("client_currency")) or DEFAULT_CURRENCY)
            ctx.currency[legacy] = currency

            # Pairing evidence (in memory). Voucher orders hold a credit amount
            # in dcmPatientName, so they never take part.
            if _epoch_ok(submitted):
                t, src = int(submitted.timestamp()), "dateSent"
            elif created_legacy:
                t, src = int(created_legacy.timestamp()), "CreatedAt"
            else:
                t, src = None, None
            is_voucher = bool(as_int(r.get("VrID")))
            ctx.pair_info[legacy] = (doc, scan or 0,
                                     None if is_voucher else _name_hash(r.get("dcmPatientName")),
                                     t, src, is_voucher)
            ctx.arch[legacy] |= _teeth_arches(r.get("ImplantsSites"), r.get("crownSites"),
                                              r.get("abutmentSites"))

            pending.append((legacy, [
                legacy,                                      # order_number == Orders.ID
                contact_id,
                scan_contact,
                pmap.get(str(as_int(r.get("projectId")))),
                "completed" if as_bool(r.get("closed")) else "submitted",
                currency,
                as_text(r.get("clientComment")),
                as_text(r.get("internalComment")),
                # thirdPartyService is the id of the service used, not a flag.
                (as_int(r.get("thirdPartyService")) or 0) > 0,
                as_bool(r.get("testing")),
                as_date(r.get("SurgeryDate")),
                submitted,
                closed,
                emap.get(str(as_int(r.get("closer")))),
                json.dumps(meta),
                submitted or created_legacy or datetime.now(timezone.utc),
                legacy,
            ]))
            if len(pending) >= 2000:
                flush()
        flush()
        ids.record_many("Orders", "orders.cases", STAGE + ":cases", rc.run_id, case_pairs)
        pg.commit()
        st.messages.append(f"{counts['scan_center_owned']} orders owned by their scanning centre (DocID = 0); "
                           f"{counts['placeholder']} orders on the placeholder contact (U7); "
                           f"{counts['scan_orphan']} orphan ScanID -> NULL + metadata")
        log.info("   placeholder-contact orders: %d; orphan ScanID: %d",
                 counts["placeholder"], counts["scan_orphan"])

    with pg.cursor() as cur:
        cur.execute(
            """INSERT INTO core.number_sequences (tenant_id, sequence_code, current_value)
               SELECT %s, 'order_number', COALESCE(max(order_number), 0)
               FROM orders.orders WHERE tenant_id = %s
               ON CONFLICT (tenant_id, sequence_code) DO UPDATE
                   SET current_value = GREATEST(core.number_sequences.current_value,
                                                EXCLUDED.current_value)""",
            (tid, tid))
    pg.commit()


# ---------------------------------------------------------------------------
# retired families (Q21)
# ---------------------------------------------------------------------------
def _retired_tables(rc, my, pg, ctx: Ctx):
    """OrderTrn and OrderOrtho are retired (Q21): every row is recorded in the
    exclusion ledger, with the orders that referenced it."""
    for table, col in (("OrderTrn", "TrnID"), ("OrderOrtho", "orthoID")):
        with Stage(rc, STAGE, legacy=table, target="audit.migration_exclusions") as st:
            if not table_exists(my, table):
                st.skip(f"{table} absent")
                continue
            for r in stream(my, f"SELECT ID FROM `{table}`"):
                st.read()
                rid = as_int(r.get("ID"))
                st.exclude(table, "retired_table", legacy_id=rid, approval_reference=Q21,
                           details={"referenced_by_orders": ctx.refs[col].get(rid, [])})
            st.messages.append("explained: every row excluded by decision (Q21 retired table)")


# ---------------------------------------------------------------------------
# order items from the line tables
# ---------------------------------------------------------------------------
def _service_index(my) -> dict[int, list[tuple]]:
    """subOrderID -> [(serviceID, orderTypeID, isDigital)] — small (19k rows)."""
    out: dict[int, list[tuple]] = defaultdict(list)
    if table_exists(my, "SubOrderServices"):
        for r in stream(my, "SELECT subOrderID, serviceID, orderTypeID, isDigital FROM `SubOrderServices`"):
            out[as_int(r.get("subOrderID"))].append(
                (as_int(r.get("serviceID")), as_int(r.get("orderTypeID")), as_int(r.get("isDigital")) or 0))
    return out


def _appliance_type(sid) -> int:
    """OrderAppliance status ids belong to OrdersFlow family 1 or 10."""
    if STATUS and sid is not None and sid in STATUS.flows.get((10, 0, None), ()):
        return 10
    return 1


def _arch_from_line(table, r) -> set[str]:
    out = set()
    if table in ("OrderTP", "OrderSim"):
        if as_int(r.get("Maxilla")):
            out.add("maxilla")
        if as_int(r.get("Mandible")):
            out.add("mandible")
    elif table == "OrderAppliance":
        if as_int(r.get("MaxillaType")):
            out.add("maxilla")
        if as_int(r.get("MandibleType")):
            out.add("mandible")
        aoi = as_int(r.get("archOfInterest"))       # legacy comment: 0 maxilla, 1 mandible, 2 both
        if aoi in (0, 2):
            out.add("maxilla")
        if aoi in (1, 2):
            out.add("mandible")
    return out


def _items_from_line_tables(rc, my, pg, ids, tid, ctx: Ctx, services):
    """Every line row referenced by an order -> one item per referencing order.
    Unreferenced rows (their order was deleted) -> exclusion 'parent_deleted'."""
    emap = ids.load("WSacounts", "iam.users")
    catmap = ids.load("OrderTypes", "catalog.categories")
    fallback = _fallback_items(pg, tid, catmap)

    for spec in LINE_TABLES:
        table, pk, cols = spec["table"], spec["pk"], spec["cols"]
        with Stage(rc, STAGE, legacy=table, target="orders.order_items") as st:
            if not table_exists(my, table):
                st.skip(f"{table} absent")
                continue
            select = [pk] + [c for c in cols.values() if c] + spec["extra"]
            selected = [f"`{c}`" for c in dict.fromkeys(select)]
            selected.append(ctx.billed_party.select_expr(table))
            sql = (f"SELECT {', '.join(selected)} "
                   f"FROM `{table}` ORDER BY `{pk}`")
            writer = BatchWriter(pg, st, ITEM_SQL, returning=True)
            keys: dict[str, tuple] = {}
            seen: set[int] = set()
            counts = Counter()

            def g(r, logical):
                col = cols.get(logical)
                return r.get(col) if col else None

            for r in stream(my, sql):
                st.read()
                line_id = as_int(r.get(pk))
                seen.add(line_id)
                referencing = [(o, role, stage_) for col, role, stage_ in spec["refs"]
                               for o in ctx.refs[col].get(line_id, [])]
                if not referencing:
                    st.exclude(table, "parent_deleted", legacy_id=line_id,
                               approval_reference=Q21,
                               details={"reason": "no Orders row references this line"})
                    continue
                arches = _arch_from_line(table, r)
                sid = as_int(g(r, "status"))
                # subOrderID numbers overlap between OrderRestoration and OrderOther,
                # so a line's services are only those of its own orderTypeIDs.
                own_types = {"OrderRestoration": (11, 18), "OrderOther": (17,)}.get(table, ())
                svc_rows = [s for s in services.get(line_id, []) if s[1] in own_types]

                for n, (order_legacy, role, rstage) in enumerate(sorted(referencing)):
                    order_pk = ctx.order_id.get(order_legacy)
                    if not order_pk:
                        st.skip("line row whose order was not migrated")
                        continue
                    ctx.arch[order_legacy] |= arches
                    ot = spec["order_type"]
                    if table == "OrderRestoration":
                        # "unless the line's order type says final": its services'
                        # orderTypeID (Q21) overrides the referencing column.
                        types = {t for _s, t, _d in svc_rows}
                        if role == "temp_restoration" and types == {18}:
                            role, rstage = "final_restoration", "final"
                            counts["temp_ref_but_final_services"] += 1
                        ot = 18 if role == "final_restoration" else 11
                        dig = 1 if any(d for _s, _t, d in svc_rows) else 0
                    elif table == "OrderAppliance":
                        ot = _appliance_type(sid)
                        dig = 0
                    else:
                        dig = 1 if as_int(g(r, "digital")) else 0
                    flow_svc = STATUS.flow_service(ot, dig, sid) if STATUS else None
                    meta = workflow_meta(ot, dig, flow_svc, sid, flow_svc)
                    if table == "OrderSG" and as_int(r.get("serviceID")):
                        meta["legacy_line_service_id"] = as_int(r.get("serviceID"))
                    if table == "OrderTP":
                        is_ai, ai_failed = as_int(r.get("is_ai")), as_int(r.get("aiFailed"))
                        meta.update(legacy_is_ai=is_ai, legacy_ai_failed=ai_failed)
                        ctx.tp_ai[line_id] = (is_ai, ai_failed, sid)
                    if table == "OrderRestoration":
                        meta["legacy_restoration_type"] = as_int(r.get("restorationType"))
                    if table == "OrderMisc":
                        meta["legacy_misc_type"] = as_int(r.get("type"))
                    if arches:
                        meta["arches"] = sorted(arches)
                    # A line shared by several orders (a few dozen rows): the
                    # lowest Orders.ID keeps the plain key, the others get one.
                    lkey = None if n == 0 else f"Orders:{order_legacy}"
                    cat = spec["cat"] if table != "OrderRestoration" else \
                        ("final_restoration" if ot == 18 else "temp_restoration")
                    cat_ot = ot if table == "OrderRestoration" else spec["order_type"]
                    payer = _resolve_billed_party(
                        ctx, table, r, order_legacy, line_id, lkey
                    )
                    meta["billed_party_migration"] = payer.evidence
                    writer.add(item_row(
                        order_id=order_pk, line_number=ctx.next_line(order_pk),
                        item_role=role, restoration_stage=rstage,
                        sellable_item_id=fallback(f"legacy_{cat}",
                                                  f"{cat.replace('_', ' ').title()} (legacy)",
                                                  cat_ot, table),
                        status=map_status(sid, order_type=ot, is_digital=dig, table=table),
                        currency_code=ctx.currency.get(order_legacy, DEFAULT_CURRENCY),
                        billed_to_contact_id=payer.contact_id,
                        billed_party_origin=payer.origin,
                        unit_price=as_money(g(r, "cost")),
                        is_digital=bool(dig), is_redo=as_bool(g(r, "redo")),
                        sales_agent_user_id=emap.get(str(as_int(g(r, "sales")))),
                        designer_user_id=emap.get(str(as_int(g(r, "designer")))),
                        operator_user_id=emap.get(str(as_int(g(r, "operator")))),
                        shipped_by_user_id=emap.get(str(as_int(r.get("shippedBy"))))
                        if table == "OrderOther" else None,
                        closed_by_user_id=emap.get(str(as_int(g(r, "closer")))),
                        service_notes=as_text(g(r, "notes")),
                        completed_at=as_ts(g(r, "end")),
                        closed_at=as_ts(g(r, "close_date")),
                        created_at=next((x for x in (as_ts(g(r, "sent")), as_ts(g(r, "created")))
                                         if _epoch_ok(x)), None),
                        metadata=meta,
                        legacy_id=line_id, legacy_key=lkey, legacy_source=table),
                        key=f"{line_id}" if n == 0 else f"{line_id}@{order_legacy}")
                    keys[f"{line_id}" if n == 0 else f"{line_id}@{order_legacy}"] = (line_id, order_legacy)

            pairs = writer.finish()
            for k, item_id in pairs:
                line_id, order_legacy = keys[k]
                ctx.line_item[(table, line_id, order_legacy)] = item_id
            ids.record_many(table, "orders.order_items", f"{STAGE}:{table}", rc.run_id, pairs)
            pg.commit()
            dangling = sum(1 for col, _r, _s in spec["refs"] for lid in ctx.refs[col] if lid not in seen)
            if dangling:
                st.messages.append(f"{dangling} Orders references point at no {table} row "
                                   "(no source row: nothing to migrate or exclude)")
            for k, v in counts.items():
                st.messages.append(f"{k}: {v}")
            log.info("   %s: %d dangling Orders references; %s", table, dangling, dict(counts))


# ---------------------------------------------------------------------------
# SubOrderServices: services under their line (Q21 third level)
# ---------------------------------------------------------------------------
def _items_from_suborders(rc, my, pg, ids, tid, ctx: Ctx):
    with Stage(rc, STAGE, legacy="SubOrderServices", target="orders.order_items") as st:
        if not table_exists(my, "SubOrderServices"):
            st.skip("SubOrderServices absent")
            return
        smap = ids.load("Services", "catalog.sellable_items")
        emap = ids.load("WSacounts", "iam.users")
        cmap = ids.load("UserAcounts", "crm.contacts")
        currency_by_legacy = _currency_by_legacy(pg)
        with pg.cursor() as cur:
            cur.execute(
                """SELECT lv.id, lv.legacy_id, lt.code AS type_code
                   FROM core.lookup_values lv JOIN core.lookup_types lt ON lt.id = lv.lookup_type_id
                   WHERE lt.code IN ('rush_type','zero_charge_reason')""")
            lookups = {(r["type_code"], str(r["legacy_id"])): r["id"] for r in cur.fetchall()}

        sql = f"""SELECT subOrderID, serviceID, orderTypeID, isDigital, statusID, cost,
                        currencyID, {ctx.billed_party.select_expr('SubOrderServices')},
                        invoiced, zeroReason, zeroReason_otherOption,
                        salesAgentId, closeCommision, isRedo, rushType, serviceProvider,
                        designedBy, operatorId, revisedBy, shippedBy, closer, rxNotes,
                        pendingReason, dueDate, sentToProductionTime, revisionDate, dateEnd,
                        closeDate, dateSent, creatorID
                 FROM `SubOrderServices` ORDER BY subOrderID, serviceID, orderTypeID"""
        writer = BatchWriter(pg, st, ITEM_SQL, returning=True)
        alias: dict[str, str] = {}
        counts = Counter()
        for r in stream(my, sql):
            st.read()
            sub, svc, ot = as_int(r.get("subOrderID")), as_int(r.get("serviceID")), as_int(r.get("orderTypeID"))
            key3 = f"{sub}:{svc}:{ot}"
            parent = SERVICE_PARENTS.get(ot)
            if parent is None:
                st.exclude("SubOrderServices", "unresolvable_reference", legacy_id=sub,
                           legacy_key=key3, details={"order_type_id": ot,
                                                     "reason": "no known parent line family"})
                continue
            table, col, role, rstage = parent
            orders_ = sorted(ctx.refs[col].get(sub, []))
            if not orders_:
                st.exclude("SubOrderServices", "parent_deleted", legacy_id=sub, legacy_key=key3,
                           approval_reference=Q21,
                           details={"order_type_id": ot, "parent_table": table,
                                    "reason": f"no Orders.{col} references {table} {sub}"})
                continue
            order_legacy = orders_[0]
            if order_legacy in ctx.placeholder_orders:
                counts["child_of_placeholder_contact_order"] += 1
                log.info("   SubOrderServices %s belongs to placeholder-contact order %s",
                         key3, order_legacy)
            order_pk = ctx.order_id.get(order_legacy)
            parent_item = ctx.line_item.get((table, sub, order_legacy))
            if not order_pk or not parent_item:
                st.skip("service whose order or parent line item was not migrated")
                continue
            item_id = smap.get(str(svc))
            if not item_id:
                st.skip(f"serviceID {svc} not in catalog")
                continue
            dig = as_int(r.get("isDigital")) or 0
            sid = as_int(r.get("statusID"))
            meta = workflow_meta(ot, dig, svc, sid,
                                 STATUS.flow_service(ot, dig, sid, svc) if STATUS else None)
            payer = _resolve_billed_party(
                ctx, "SubOrderServices", r, order_legacy, sub, key3
            )
            meta["billed_party_migration"] = payer.evidence
            writer.add(item_row(
                order_id=order_pk, line_number=ctx.next_line(order_pk),
                parent_item_id=parent_item, item_role=role, restoration_stage=rstage,
                sellable_item_id=item_id,
                status=map_status(sid, order_type=ot, is_digital=dig),
                currency_code=currency_by_legacy.get(str(as_int(r.get("currencyID")))) or DEFAULT_CURRENCY,
                billed_to_contact_id=payer.contact_id,
                billed_party_origin=payer.origin,
                unit_price=as_money(r.get("cost")),
                is_invoiced=as_bool(r.get("invoiced")),
                zero_charge_reason_id=lookups.get(("zero_charge_reason", str(as_int(r.get("zeroReason"))))),
                zero_charge_note=as_text(r.get("zeroReason_otherOption"), 255),
                sales_agent_user_id=emap.get(str(as_int(r.get("salesAgentId")))),
                commission_amount=as_money(r.get("closeCommision"), default=None)
                if r.get("closeCommision") else None,
                is_digital=bool(dig), is_redo=as_bool(r.get("isRedo")),
                rush_type_id=lookups.get(("rush_type", str(as_int(r.get("rushType"))))),
                service_provider_id=cmap.get(str(as_int(r.get("serviceProvider")))),
                designer_user_id=emap.get(str(as_int(r.get("designedBy")))),
                operator_user_id=emap.get(str(as_int(r.get("operatorId")))),
                reviewer_user_id=emap.get(str(as_int(r.get("revisedBy")))),
                shipped_by_user_id=emap.get(str(as_int(r.get("shippedBy")))),
                closed_by_user_id=emap.get(str(as_int(r.get("closer")))),
                service_notes=as_text(r.get("rxNotes")),
                pending_reason=as_text(r.get("pendingReason"), 255),
                due_at=as_ts(r.get("dueDate")),
                sent_to_production_at=as_ts(r.get("sentToProductionTime")),
                revised_at=as_ts(r.get("revisionDate")),
                completed_at=as_ts(r.get("dateEnd")),
                closed_at=as_ts(r.get("closeDate")),
                created_at=as_ts(r.get("dateSent")),
                created_by_user_id=emap.get(str(as_int(r.get("creatorID")))),
                metadata=meta,
                # Full composite key (v2 defect 33): (subOrderID, serviceID, orderTypeID).
                legacy_id=sub, legacy_key=key3, legacy_source="SubOrderServices"),
                key=key3)
            alias[key3] = f"{sub}:{svc}"
        pairs = writer.finish()
        # The id map carries the full key, plus the v2 two-part "sub:svc" alias
        # that stages 50/60/80 still look up — only where it is unambiguous.
        two = Counter(alias.values())
        extra = [(alias[k], v) for k, v in pairs if two[alias[k]] == 1]
        ids.record_many("SubOrderServices", "orders.order_items", STAGE + ":suborders",
                        rc.run_id, pairs + extra)
        pg.commit()
        for k, v in counts.items():
            st.messages.append(f"{k}: {v}")
        ambiguous = sum(1 for v in two.values() if v > 1)
        if ambiguous:
            st.messages.append(f"{ambiguous} (subOrderID, serviceID) pairs span several "
                               "orderTypeIDs: no two-part alias recorded for them")


# ---------------------------------------------------------------------------
# iSmile: Orders.IsmileID -> IsmileOrder (primary) -> IsmileSubOrder (children)
# ---------------------------------------------------------------------------
def _items_ismile(rc, my, pg, ids, tid, ctx: Ctx):
    if not table_exists(my, "IsmileOrder"):
        with Stage(rc, STAGE, legacy="IsmileOrder", target="orders.order_items") as st:
            st.skip("IsmileOrder absent")
        return
    emap = ids.load("WSacounts", "iam.users")
    catmap = ids.load("OrderTypes", "catalog.categories")
    fallback = _fallback_items(pg, tid, catmap)
    decode_currency = currency_decoder(my, _currency_by_legacy(pg))

    subs: dict[int, list[dict]] = defaultdict(list)
    for r in stream(my, f"""SELECT id, status, statusCode, cost, createdDate, sentDate,
                                  chargedDate, revised_by, ismileOrderID, orderType, Currency,
                                  Invoiced, {ctx.billed_party.select_expr('IsmileSubOrder')},
                                  redo, closer, closeDate, is_indicated,
                                  shipping_cost, CreatedAt, sentToProduction
                           FROM `IsmileSubOrder` ORDER BY id"""):
        subs[as_int(r.get("ismileOrderID"))].append(r)

    parents: dict[int, tuple[int, int, int]] = {}   # IsmileOrder.id -> (item id, Orders.ID, ot)
    with Stage(rc, STAGE, legacy="IsmileOrder", target="orders.order_items") as st:
        writer = BatchWriter(pg, st, ITEM_SQL, returning=True)
        keys = {}
        for r in stream(my, f"""SELECT id, archType, refinementFor, chosenTier, createdFrom,
                                      notIndicationReasonType, CreatedAt,
                                      {ctx.billed_party.select_expr('IsmileOrder')}
                               FROM `IsmileOrder` ORDER BY id"""):
            st.read()
            iid = as_int(r.get("id"))
            orders_ = sorted(ctx.refs["IsmileID"].get(iid, []))
            if not orders_:
                st.exclude("IsmileOrder", "parent_deleted", legacy_id=iid, approval_reference=Q21,
                           details={"reason": "no Orders row references this iSmile order",
                                    "sub_orders": len(subs.get(iid, []))})
                continue
            order_legacy = orders_[0]
            order_pk = ctx.order_id.get(order_legacy)
            if not order_pk:
                st.skip("iSmile order whose order was not migrated")
                continue
            refinement_for = as_int(r.get("refinementFor")) or None
            ot = ISMILE_REFINEMENT_ORDER_TYPE if refinement_for else ISMILE_ORDER_TYPE
            children = subs.get(iid, [])
            # No status of its own: it shows its latest sub-order's state.
            status = (classify_status_label(as_text(children[-1].get("status")))
                      if children else "submitted")
            meta = workflow_meta(ot, 0, None, None)
            meta.update(ismile_arch_type=as_int(r.get("archType")),
                        ismile_refinement_for=refinement_for,
                        ismile_chosen_tier=as_text(r.get("chosenTier")),
                        ismile_created_from=as_text(r.get("createdFrom")),
                        not_indication_reason_type=as_text(r.get("notIndicationReasonType")))
            if len(orders_) > 1:
                meta["also_referenced_by_orders"] = orders_[1:]
            payer = _resolve_billed_party(
                ctx, "IsmileOrder", r, order_legacy, iid
            )
            meta["billed_party_migration"] = payer.evidence
            writer.add(item_row(
                order_id=order_pk, line_number=ctx.next_line(order_pk),
                item_role="primary",
                sellable_item_id=fallback("legacy_ismile", "iSmile (legacy)", ISMILE_ORDER_TYPE,
                                          "IsmileOrder"),
                status=status,
                currency_code=ctx.currency.get(order_legacy, DEFAULT_CURRENCY),
                billed_to_contact_id=payer.contact_id,
                billed_party_origin=payer.origin,
                created_at=as_ts(r.get("CreatedAt")) if _epoch_ok(as_ts(r.get("CreatedAt"))) else None,
                metadata=meta, legacy_id=iid, legacy_source="IsmileOrder"), key=iid)
            keys[str(iid)] = (order_legacy, ot)
        pairs = writer.finish()
        for k, item_id in pairs:
            order_legacy, ot = keys[k]
            parents[int(k)] = (item_id, order_legacy, ot)
        ids.record_many("IsmileOrder", "orders.order_items", STAGE + ":IsmileOrder", rc.run_id, pairs)
        pg.commit()

    with Stage(rc, STAGE, legacy="IsmileSubOrder", target="orders.order_items") as st:
        writer = BatchWriter(pg, st, ITEM_SQL, returning=True)
        known_parents = set()
        for r in stream(my, "SELECT id FROM `IsmileOrder`"):
            known_parents.add(as_int(r.get("id")))
        for iid in sorted(subs):
            for r in subs[iid]:
                st.read()
                sid_ = as_int(r.get("id"))
                parent = parents.get(iid)
                if parent is None:
                    if iid in known_parents and not ctx.refs["IsmileID"].get(iid):
                        why = "its iSmile order is referenced by no Orders row"
                    elif iid not in known_parents:
                        why = "its iSmile order row does not exist"
                    else:
                        st.skip("iSmile sub-order whose parent item was not migrated")
                        continue
                    st.exclude("IsmileSubOrder", "parent_deleted", legacy_id=sid_,
                               approval_reference=Q21,
                               details={"ismile_order_id": iid, "reason": why})
                    continue
                parent_item, order_legacy, ot = parent
                order_pk = ctx.order_id[order_legacy]
                status_code = as_int(r.get("statusCode"))
                meta = workflow_meta(ot, 0, None, status_code)
                meta.update(ismile_suborder_type=as_int(r.get("orderType")),
                            is_indicated=as_int(r.get("is_indicated")),
                            shipping_cost=as_int(r.get("shipping_cost")))
                payer = _resolve_billed_party(
                    ctx, "IsmileSubOrder", r, order_legacy, sid_
                )
                meta["billed_party_migration"] = payer.evidence
                created = as_ts(r.get("createdDate"))
                if not _epoch_ok(created):
                    created = as_ts(r.get("CreatedAt"))
                writer.add(item_row(
                    order_id=order_pk, line_number=ctx.next_line(order_pk),
                    parent_item_id=parent_item, item_role="ismile_suborder",
                    sellable_item_id=fallback("legacy_ismile_suborder", "iSmile Sub-order (legacy)",
                                              ISMILE_ORDER_TYPE, "IsmileSubOrder"),
                    status=classify_status_label(as_text(r.get("status"))),
                    currency_code=decode_currency(r.get("Currency"))
                    or ctx.currency.get(order_legacy, DEFAULT_CURRENCY),
                    billed_to_contact_id=payer.contact_id,
                    billed_party_origin=payer.origin,
                    unit_price=as_money(r.get("cost")),
                    is_redo=as_bool(r.get("redo")),
                    closed_by_user_id=emap.get(str(as_int(r.get("closer")))),
                    reviewer_user_id=emap.get(str(as_int(r.get("revised_by")))),
                    sent_to_production_at=as_ts(r.get("sentToProduction")),
                    closed_at=as_ts(r.get("closeDate")),
                    created_at=created if _epoch_ok(created) else None,
                    metadata=meta, legacy_id=sid_, legacy_source="IsmileSubOrder"), key=sid_)
        ids.record_many("IsmileSubOrder", "orders.order_items", STAGE + ":IsmileSubOrder",
                        rc.run_id, writer.finish())
        pg.commit()


# ---------------------------------------------------------------------------
# field values
# ---------------------------------------------------------------------------
def _field_values(rc, my, pg, ids, tid):
    """SubOrderServicesFields -> orders.order_item_field_values (review item #4).
    Keyed to its service by the full (subOrderID, serviceID, orderTypeID)."""
    with Stage(rc, STAGE, legacy="SubOrderServicesFields",
               target="orders.order_item_field_values") as st:
        if not table_exists(my, "SubOrderServicesFields"):
            st.skip("SubOrderServicesFields absent")
            return
        imap = ids.load("SubOrderServices", "orders.order_items")
        fmap = ids.load("FormFields", "catalog.fields")
        with pg.cursor() as cur:
            cur.execute("""SELECT legacy_key FROM audit.migration_exclusions
                           WHERE legacy_table = 'SubOrderServices' AND run_id = %s""", (rc.run_id,))
            excluded = {r["legacy_key"] for r in cur.fetchall()}

        writer = BatchWriter(
            pg, st,
            """INSERT INTO orders.order_item_field_values
                   (order_item_id, field_id, value_text, value_number,
                    charged_amount, legacy_id, legacy_source)
               VALUES (%s, %s, %s, %s, %s, %s, 'SubOrderServicesFields')
               ON CONFLICT (order_item_id, field_id, field_option_id) DO NOTHING""",
            size=5000)
        for r in stream(my, """SELECT id, subOrderID, serviceID, orderTypeID, fieldID,
                                      fieldValue, fieldCost
                               FROM `SubOrderServicesFields`"""):
            st.read()
            key = f"{as_int(r.get('subOrderID'))}:{as_int(r.get('serviceID'))}:{as_int(r.get('orderTypeID'))}"
            item_id = imap.get(key)
            if not item_id:
                if key in excluded:
                    st.exclude("SubOrderServicesFields", "parent_deleted", legacy_id=as_int(r.get("id")),
                               approval_reference=Q21,
                               details={"service_key": key, "reason": "its service row is excluded"})
                else:
                    st.exclude("SubOrderServicesFields", "parent_deleted", legacy_id=as_int(r.get("id")),
                               approval_reference=Q21,
                               details={"service_key": key, "reason": "no SubOrderServices row with this key"})
                continue
            field_id = fmap.get(str(as_int(r.get("fieldID"))))
            if not field_id:
                st.skip("field value whose FormFields row was not migrated")
                continue
            raw = as_text(r.get("fieldValue"))
            num = None
            if raw is not None:
                try:
                    num = Decimal(raw)
                    if not num.is_finite():
                        num = None
                except Exception:                    # noqa: BLE001
                    num = None
            writer.add([item_id, field_id, raw, num, as_money(r.get("fieldCost")), as_int(r.get("id"))])
        writer.finish()


# ---------------------------------------------------------------------------
# Relu AI planning: OrderTPAI + OrderTP.is_ai / aiFailed -> order_item_ai_plans
# ---------------------------------------------------------------------------
# OrderTP status ids of the AI flow (OrdersFlow OrderType 3): 152 AiPendingUploads,
# 153 AiProcessing, 154 AiReady.
AI_STATUS_BY_TP_STATUS = {152: "eligible", 153: "processing", 154: "ready"}


def _ai_state(is_ai, ai_failed, sid):
    """(planning_mode, ai_status, ai_decision) per the V011 column comments:
    is_ai=1 -> 'ai'; aiFailed=1 -> 'failed' / 'ai_failed_fallback'. An AI plan
    neither failed nor in an AI status (152-154) has no legacy job status: it is
    left 'not_applicable' and the raw flags stay in the TP item's metadata."""
    if ai_failed:
        return ("ai" if is_ai else "manual"), "failed", "ai_failed_fallback"
    if is_ai:
        status = AI_STATUS_BY_TP_STATUS.get(sid, "not_applicable")
        return "ai", status, ("ai_ready" if status == "ready" else "ai_selected")
    return "manual", "not_applicable", "undecided"


def _ai_plans(rc, my, pg, ids, tid, ctx: Ctx):
    with Stage(rc, STAGE, legacy="OrderTPAI", target="orders.order_item_ai_plans") as st:
        cols = ["reluId", "printer_offset", "guide_thickness", "text_to_print", "guide_bar",
                "glue_holes", "implant_filters_folder", "implant_filters_productLine",
                "sleeve_filters_folder", "sleeve_filters_productLine", "waxup_filters_folder",
                "surgical_kit_filters_folder", "surgical_kit_filters_productLine",
                "lower_jaw", "upper_jaw", "volume", "facial_scan", "bite", "AiActions"]
        sql = """INSERT INTO orders.order_item_ai_plans
                     (order_item_id, planning_mode, ai_status, ai_decision, relu_id,
                      printer_offset, guide_thickness, text_to_print, guide_bar, glue_holes,
                      implant_filters_folder, implant_filters_product_line,
                      sleeve_filters_folder, sleeve_filters_product_line, waxup_filters_folder,
                      surgical_kit_filters_folder, surgical_kit_filters_product_line,
                      lower_jaw, upper_jaw, volume, facial_scan, bite, ai_actions_enabled,
                      legacy_id, legacy_source)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                         %s, %s, %s, %s, %s, %s, %s, %s)
                 RETURNING id"""
        writer = BatchWriter(pg, st, sql, returning=True)
        used_items: set[int] = set()
        relu_refs: list[tuple] = []          # (order_item_id, reluId, OrderTPAI.id)

        def tp_item(tpid):
            orders_ = sorted(ctx.refs["TPID"].get(tpid, []))
            return ctx.line_item.get(("OrderTP", tpid, orders_[0])) if orders_ else None

        covered_tp: set[int] = set()
        if table_exists(my, "OrderTPAI"):
            for r in stream(my, "SELECT id, TPID, " + ", ".join(f"`{c}`" for c in cols)
                            + " FROM `OrderTPAI` ORDER BY id"):
                st.read()
                rid, tpid = as_int(r.get("id")), as_int(r.get("TPID"))
                item = tp_item(tpid)
                if not item:
                    st.exclude("OrderTPAI", "unresolvable_reference", legacy_id=rid,
                               details={"tp_id": tpid,
                                        "reason": "TPID resolves to no migrated treatment-plan item"})
                    continue
                if item in used_items:
                    st.exclude("OrderTPAI", "duplicate_source_row", legacy_id=rid,
                               details={"tp_id": tpid, "reason": "a second OrderTPAI row for the same TP line"})
                    continue
                used_items.add(item)
                covered_tp.add(tpid)
                is_ai, ai_failed, sid = ctx.tp_ai.get(tpid, (None, None, None))
                # An OrderTPAI row is the Relu request itself: the plan is AI.
                mode, status, decision = _ai_state(1 if is_ai is None else is_ai, ai_failed, sid)
                glue = as_int(r.get("glue_holes"))
                writer.add([item, mode, status, decision, as_text(r.get("reluId"), 255),
                            as_money(r.get("printer_offset"), default=None),
                            as_money(r.get("guide_thickness"), default=None),
                            as_text(r.get("text_to_print")), as_text(r.get("guide_bar"), 255),
                            None if glue is None else bool(glue),
                            as_text(r.get("implant_filters_folder"), 255),
                            as_text(r.get("implant_filters_productLine"), 255),
                            as_text(r.get("sleeve_filters_folder"), 255),
                            as_text(r.get("sleeve_filters_productLine"), 255),
                            as_text(r.get("waxup_filters_folder"), 255),
                            as_text(r.get("surgical_kit_filters_folder"), 255),
                            as_text(r.get("surgical_kit_filters_productLine"), 255),
                            as_text(r.get("lower_jaw"), 255), as_text(r.get("upper_jaw"), 255),
                            as_text(r.get("volume"), 255), as_text(r.get("facial_scan"), 255),
                            as_text(r.get("bite"), 255),
                            as_bool(r.get("AiActions"), default=True),
                            rid, "OrderTPAI"], key=f"OrderTPAI:{rid}")
                if as_text(r.get("reluId")):
                    relu_refs.append((item, as_text(r.get("reluId"), 255), rid))
        else:
            st.skip("OrderTPAI absent")

        # TP lines flagged AI (or AI-failed) with no OrderTPAI row.
        flagged = 0
        for tpid, (is_ai, ai_failed, sid) in sorted(ctx.tp_ai.items()):
            if tpid in covered_tp or not (is_ai or ai_failed):
                continue
            item = tp_item(tpid)
            if not item or item in used_items:
                continue
            flagged += 1
            used_items.add(item)
            mode, status, decision = _ai_state(is_ai, ai_failed, sid)
            writer.add([item, mode, status, decision] + [None] * 18 + [True, tpid, "OrderTP"],
                       key=f"OrderTP:{tpid}")
        pairs = writer.finish()
        st.messages.append(f"{flagged} plans from OrderTP is_ai/aiFailed flags without an OrderTPAI row")

    with Stage(rc, STAGE, legacy="OrderTPAI[reluId]", target="integration.external_references") as st:
        with pg.cursor() as cur:
            cur.execute("SELECT id FROM integration.providers WHERE code = 'relu'")
            row = cur.fetchone()
        if not row:
            st.skip("relu provider not seeded")
            return
        seen_ext: set[str] = set()
        writer = BatchWriter(
            pg, st,
            """INSERT INTO integration.external_references
                   (tenant_id, provider_id, entity_type, entity_id, external_id, external_kind,
                    legacy_id, legacy_source)
               VALUES (%s, %s, 'order_item', %s, %s, 'relu_case', %s, 'OrderTPAI')""")
        for item, relu, rid in relu_refs:
            st.read()
            if relu in seen_ext:
                st.skip("reluId already referenced by an earlier OrderTPAI row")
                continue
            seen_ext.add(relu)
            writer.add([tid, row["id"], item, relu, rid])
        writer.finish()


# ---------------------------------------------------------------------------
# split-arch case pairing candidates (Q3, U8) — nothing is merged
# ---------------------------------------------------------------------------
GAP_BUCKETS = [(60, "<1 min"), (300, "1-5 min"), (900, "5-15 min"), (3600, "15-60 min"),
               (86400, "1-24 h"), (None, ">24 h")]
TIME_SCORE = {"<1 min": 0.45, "1-5 min": 0.40, "5-15 min": 0.30, "15-60 min": 0.20,
              "1-24 h": 0.10, ">24 h": 0.0, "unknown": 0.0}


def _bucket(gap):
    if gap is None:
        return "unknown"
    for limit, name in GAP_BUCKETS:
        if limit is None or gap < limit:
            return name
    return ">24 h"


def _case_pairing_candidates(rc, pg, ctx: Ctx):
    """Candidate pairs: same DocID, same ScanID, same normalised patient name
    (voucher orders excluded), one order maxilla-only and the other
    mandible-only, created within PAIRING_WINDOW_SECONDS (or time unknown).

    Arch per order is the union of: OrderTP/OrderSim Maxilla/Mandible flags,
    OrderAppliance MaxillaType/MandibleType/archOfInterest, and the Universal
    tooth numbers in Orders.ImplantsSites/crownSites/abutmentSites. Reports,
    restorations, software, misc, other and iSmile carry no usable arch
    (OrderRestoration.arch_of_interest and IsmileOrder.archType have no
    documented code meaning), so such orders pair only through their teeth.
    """
    with Stage(rc, STAGE, legacy="Orders", target="orders.case_pairing_candidates") as st:
        groups: dict[tuple, list[int]] = defaultdict(list)
        arch_cov = Counter()
        for legacy, (doc, scan, name, t, src, voucher) in ctx.pair_info.items():
            st.read()
            arches = ctx.arch.get(legacy, set())
            arch_cov["voucher" if voucher else ("unknown" if not arches else
                      ("both" if len(arches) == 2 else next(iter(arches))))] += 1
            if voucher or not name or len(arches) != 1 or legacy not in ctx.order_id:
                continue
            groups[(doc, scan, name)].append(legacy)

        cands = []
        beyond = 0
        for members in groups.values():
            if len(members) < 2:
                continue
            maxi = [m for m in members if ctx.arch[m] == {"maxilla"}]
            mand = [m for m in members if ctx.arch[m] == {"mandible"}]
            for a in maxi:
                for b in mand:
                    ta, tb = ctx.pair_info[a][3], ctx.pair_info[b][3]
                    gap = abs(ta - tb) if ta is not None and tb is not None else None
                    if gap is not None and gap > PAIRING_WINDOW_SECONDS:
                        beyond += 1
                        continue
                    cands.append((a, b, gap))

        per_order = Counter()
        for a, b, _g in cands:
            per_order[a] += 1
            per_order[b] += 1
        dist = Counter()
        auto: list[tuple] = []
        writer = BatchWriter(
            pg, st,
            """INSERT INTO orders.case_pairing_candidates
                   (order_a_id, order_b_id, score, evidence, inference_version)
               VALUES (%s, %s, %s, %s::jsonb, %s)""",
            size=2000)
        for a, b, gap in cands:
            bucket = _bucket(gap)
            dist[bucket] += 1
            pa, pb = ctx.order_id[a], ctx.order_id[b]
            (lo, llo), (hi, lhi) = sorted([(pa, a), (pb, b)])
            evidence = {
                "rule": PAIRING_VERSION,
                "signals": {"same_doctor": True, "same_scan_centre": True,
                            "scan_centre_present": bool(ctx.pair_info[a][1]),
                            "same_normalised_patient_name": True,
                            "complementary_arches": True},
                "legacy_order_a": llo, "legacy_order_b": lhi,
                "arch_a": next(iter(ctx.arch[llo])), "arch_b": next(iter(ctx.arch[lhi])),
                "time_gap_seconds": gap, "gap_bucket": bucket,
                "time_source_a": ctx.pair_info[llo][4], "time_source_b": ctx.pair_info[lhi][4],
                "competing_candidates_a": per_order[llo] - 1,
                "competing_candidates_b": per_order[lhi] - 1,
            }
            score = Decimal("0.5") + Decimal(str(TIME_SCORE[bucket]))
            competing = per_order[a] > 1 or per_order[b] > 1
            if competing:
                score -= Decimal("0.2")                # competing candidates
            if not competing and gap is not None and gap < AUTO_PAIR_MAX_GAP_SECONDS:
                evidence.update(auto_linked=True, approval="D-18 owner 2026-10-14",
                                rule_detail=f"unambiguous, gap < {AUTO_PAIR_MAX_GAP_SECONDS} s")
                auto.append((lo, hi, score, json.dumps(evidence)))
                continue
            evidence.update(auto_linked=False, why_not_auto_linked=(
                "competing candidates" if competing else
                f"creation gap unknown or >= {AUTO_PAIR_MAX_GAP_SECONDS} s") + " (D-18); pending review")
            writer.add([lo, hi, score, json.dumps(evidence), PAIRING_VERSION])
        writer.finish()

        # Auto-link: the lower order's case takes both orders; the other order's
        # one-order case is then empty and removed (cases are derived, legacy_source
        # 'Orders:case', so reconciliation does not pair them 1:1 with Orders).
        with pg.cursor() as cur:
            for lo, hi, score, ev in auto:
                cur.execute("""
                    WITH k AS (SELECT case_id FROM orders.orders WHERE id = %(lo)s),
                         m AS (SELECT case_id FROM orders.orders WHERE id = %(hi)s),
                         upd_case AS (
                             UPDATE orders.cases c SET pairing_method = 'auto_split_arch',
                                    pairing_confidence = %(score)s, pairing_evidence = %(ev)s::jsonb
                             FROM k WHERE c.id = k.case_id RETURNING c.id)
                    UPDATE orders.orders o SET case_id = (SELECT case_id FROM k)
                    WHERE o.id = %(hi)s
                    RETURNING (SELECT case_id FROM m) AS old_case""",
                    {"lo": lo, "hi": hi, "score": score, "ev": ev})
                old = cur.fetchone()["old_case"]
                cur.execute("""DELETE FROM orders.cases c WHERE c.id = %s
                               AND NOT EXISTS (SELECT 1 FROM orders.orders o WHERE o.case_id = c.id)""",
                            (old,))
        pg.commit()
        log.info("   auto-linked split-arch pairs (D-18): %s; to review: %s",
                 len(auto), len(cands) - len(auto))

        competing = sum(1 for n in per_order.values() if n > 1)
        summary = {"candidates": len(cands), "auto_linked": len(auto),
                   "to_review": len(cands) - len(auto), "gap_buckets": dict(dist),
                   "orders_with_candidates": len(per_order),
                   "orders_with_competing_candidates": competing,
                   "pairs_beyond_window": beyond, "arch_coverage": dict(arch_cov)}
        log.info("   case pairing measurement: %s", json.dumps(summary))
        st.messages.append("measurement " + json.dumps(summary))


# ---------------------------------------------------------------------------
# status history, comments, locks, carts (v2 logic; item keys updated)
# ---------------------------------------------------------------------------
def _status_history(rc, my, pg, ids, tid):
    """OrderHistory, service_status_history and PendingStatusHistory.

        OrderHistory            ID, OrderID, SubOrderID, Status, Comment,
                                HistoryTime, eID, MailTo
        service_status_history  id, order_id, order_type_id, sub_order_id,
                                service_id, old_status, new_status,
                                transaction_time, agent_id
        PendingStatusHistory    ID, OrderID, SubOrderID, PendingReason, Text,
                                Solved, CreatedAt, serviceID
    """
    omap = ids.load("Orders", "orders.orders")
    imap = ids.load("SubOrderServices", "orders.order_items")
    emap = ids.load("WSacounts", "iam.users")

    def order_of(legacy_order_id):
        return omap.get(str(as_int(legacy_order_id)))

    def item_of(sub_id, service_id, order_type_id=None):
        """sub_order_id is the LINE id (OrderRestoration / OrderOther), the
        SubOrderServices key is (subOrderID, serviceID, orderTypeID)."""
        sub, svc = as_int(sub_id), as_int(service_id)
        if sub is None or svc is None:
            return None
        ot = as_int(order_type_id)
        if ot is not None:
            hit = imap.get(f"{sub}:{svc}:{ot}")
            if hit:
                return hit
        return imap.get(f"{sub}:{svc}")

    def flush(rows):
        with pg.cursor() as cur:
            cur.executemany(
                """INSERT INTO orders.order_status_history
                       (order_id, order_item_id, from_status, to_status, comment,
                        actor_kind, actor_user_id, notified_to, changed_at,
                        legacy_id, legacy_source)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                rows)
        pg.commit()

    with Stage(rc, STAGE, legacy="OrderHistory", target="orders.order_status_history") as st:
        if not table_exists(my, "OrderHistory"):
            st.skip("OrderHistory absent")
        else:
            rows = []
            for r in stream(my, "SELECT ID, OrderID, Status, Comment, HistoryTime, eID, MailTo "
                                "FROM `OrderHistory`"):
                st.read()
                order_id = order_of(r.get("OrderID"))
                if not order_id:
                    _exclude_orphan(st, "OrderHistory", r.get("ID"), r.get("OrderID"))
                    continue
                actor = emap.get(str(as_int(r.get("eID"))))
                rows.append((order_id, None, None, map_status(r.get("Status")),
                             as_text(r.get("Comment")), "user" if actor else "system", actor,
                             as_text(r.get("MailTo"), 255),
                             as_ts(r.get("HistoryTime")) or datetime.now(timezone.utc),
                             as_int(r.get("ID")), "OrderHistory"))
                if len(rows) >= 5000:
                    flush(rows)
                    st.write(len(rows))
                    rows.clear()
            if rows:
                flush(rows)
                st.write(len(rows))

    ssh = "service_status_history"
    with Stage(rc, STAGE, legacy=ssh, target="orders.order_status_history") as st:
        if not table_exists(my, ssh):
            st.skip("service_status_history absent")
        else:
            rows = []
            for r in stream(my, "SELECT id, order_id, order_type_id, sub_order_id, service_id, "
                                "old_status, new_status, transaction_time, agent_id "
                                "FROM `service_status_history`"):
                st.read()
                order_id = order_of(r.get("order_id"))
                if not order_id:
                    _exclude_orphan(st, "service_status_history", r.get("id"), r.get("order_id"))
                    continue
                actor = emap.get(str(as_int(r.get("agent_id"))))
                ot = r.get("order_type_id")
                rows.append((order_id,
                             item_of(r.get("sub_order_id"), r.get("service_id"), ot),
                             map_status(r.get("old_status"), order_type=ot, default=None),
                             map_status(r.get("new_status"), order_type=ot),
                             None, "user" if actor else "system", actor, None,
                             as_ts(r.get("transaction_time")) or datetime.now(timezone.utc),
                             as_int(r.get("id")), ssh))
                if len(rows) >= 5000:
                    flush(rows)
                    st.write(len(rows))
                    rows.clear()
            if rows:
                flush(rows)
                st.write(len(rows))

    with Stage(rc, STAGE, legacy="PendingStatusHistory", target="orders.order_status_history") as st:
        if not table_exists(my, "PendingStatusHistory"):
            st.skip("PendingStatusHistory absent")
        else:
            rows = []
            for r in stream(my, "SELECT ID, OrderID, SubOrderID, Text, Solved, CreatedAt, serviceID "
                                "FROM `PendingStatusHistory`"):
                st.read()
                order_id = order_of(r.get("OrderID"))
                if not order_id:
                    _exclude_orphan(st, "PendingStatusHistory", r.get("ID"), r.get("OrderID"))
                    continue
                rows.append((order_id, item_of(r.get("SubOrderID"), r.get("serviceID")), None,
                             "completed" if as_bool(r.get("Solved")) else "pending_information",
                             as_text(r.get("Text")), "system", None, None,
                             as_ts(r.get("CreatedAt")) or datetime.now(timezone.utc),
                             as_int(r.get("ID")), "PendingStatusHistory"))
                if len(rows) >= 5000:
                    flush(rows)
                    st.write(len(rows))
                    rows.clear()
            if rows:
                flush(rows)
                st.write(len(rows))


def _comments(rc, my, pg, ids, tid):
    """Legacy has no order-comments table on the 2026-10-13 snapshot (order
    comments live on Orders.clientComment / internalComment, loaded above)."""
    src = next((t for t in ("OrderComments", "OrdersComments") if table_exists(my, t)), None)
    with Stage(rc, STAGE, legacy=src or "(none)", target="orders.order_comments") as st:
        if not src:
            st.skip("no order-comments table in the source")
            return
        raise EtlError(f"{src} appeared in the source: map its columns before loading it")


def _locks(rc, my, pg, ids, tid):
    """orderLockingHistory -> orders.order_locks + orders.order_lock_history.

    `action`: 0 opens a lock, 1 releases it, 2 force-releases it. Legacy stores
    the events; a lock here is one open/close pair, walked in order per order.
    An order whose last event is a 0 still holds its (single) active lock.
    """
    src = "orderLockingHistory"
    with Stage(rc, STAGE, legacy=src, target="orders.order_locks") as st:
        if not table_exists(my, src):
            st.skip("no order-locking table in the source")
            return
        omap = ids.load("Orders", "orders.orders")
        emap = ids.load("WSacounts", "iam.users")

        LOCK, RELEASE, FORCE_RELEASE = 0, 1, 2
        episodes = []
        counts = {"locks": 0, "history": 0}
        pairs: list[tuple[str, int]] = []

        def flush():
            if not episodes:
                return
            with pg.cursor() as cur:
                cur.executemany(
                    """INSERT INTO orders.order_locks
                           (order_id, status, lock_source, locked_at, locked_by_user_id,
                            locked_by_system_job, released_at, release_source,
                            released_by_user_id, legacy_id, legacy_source)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       RETURNING id""",
                    [e["lock"] for e in episodes], returning=True)
                history = []
                landed = 0
                for e in episodes:
                    row = cur.fetchone()
                    if row:
                        landed += 1
                        for action, source, user, at, ev_id in e["events"]:
                            # one history row per legacy event (legacy id = the event);
                            # a synthetic force-release has no source event (ev_id None).
                            history.append((row["id"], action, source, user,
                                            None if user else "legacy_import", at,
                                            ev_id, src if ev_id is not None else f"{src}:synthetic",
                                            None if ev_id is not None else f"after:{e['legacy_id']}"))
                        if e["legacy_id"] is not None:
                            pairs.append((str(e["legacy_id"]), row["id"]))
                    if not cur.nextset():
                        break
                if history:
                    cur.executemany(
                        """INSERT INTO orders.order_lock_history
                               (order_lock_id, action, source, performed_by_user_id,
                                performed_by_system_job, created_at, legacy_id, legacy_source, legacy_key)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        history)
                    counts["history"] += len(history)
            pg.commit()
            counts["locks"] += landed
            st.write(landed)
            episodes.clear()

        def close(open_ev, close_ev):
            order_id, locked_at, locker, open_id = open_ev
            if close_ev is None:
                released_at = released_by = None
                status, release_source = "active", None
                events = [("locked", "user" if locker else "system", locker, locked_at, open_id)]
            else:
                kind, released_at, releaser, close_id = close_ev
                released_by = releaser
                status = "released"
                release_source = "user" if releaser else "system"
                events = [("locked", "user" if locker else "system", locker, locked_at, open_id),
                          ("released" if kind == RELEASE else "force_released",
                           release_source, releaser, released_at, close_id)]
            episodes.append({
                "lock": (order_id, status, "user" if locker else "system", locked_at, locker,
                         None if locker else "legacy_import", released_at, release_source,
                         released_by, open_id, f"{src}:episode"),
                "events": events, "legacy_id": open_id})
            if len(episodes) >= 2000:
                flush()

        current_order, open_ev = None, None
        for r in stream(my, f"SELECT id, orderID, agentID, actionTime, action "
                            f"FROM `{src}` ORDER BY orderID, actionTime, id"):
            st.read()
            order_id = omap.get(str(as_int(r.get("orderID"))))
            if not order_id:
                _exclude_orphan(st, src, r.get("id"), r.get("orderID"))
                continue
            if order_id != current_order:
                if open_ev is not None:
                    close(open_ev, None)
                current_order, open_ev = order_id, None
            at = as_ts(r.get("actionTime")) or datetime.now(timezone.utc)
            agent = emap.get(str(as_int(r.get("agentID"))))
            action = as_int(r.get("action"))
            if action == LOCK:
                if open_ev is not None:
                    # a second lock with no release: legacy implied a forced release
                    close(open_ev, (FORCE_RELEASE, at, agent, None))
                open_ev = (order_id, at, agent, as_int(r.get("id")))
            elif action in (RELEASE, FORCE_RELEASE):
                if open_ev is None:
                    st.exclude(src, "unresolvable_reference", legacy_id=as_int(r.get("id")),
                               details={"reason": "release event with no lock open on that order"})
                    continue
                close(open_ev, (action, at, agent, as_int(r.get("id"))))
                open_ev = None
            else:
                st.exclude(src, "unresolvable_reference", legacy_id=as_int(r.get("id")),
                           details={"reason": f"unknown lock action {action}"})
        if open_ev is not None:
            close(open_ev, None)
        flush()
        ids.record_many(src, "orders.order_locks", STAGE + ":locks", rc.run_id, pairs)
        pg.commit()
        log.info("   %s locks, %s history rows", f"{counts['locks']:,}", f"{counts['history']:,}")


def _carts(rc, my, pg, ids, tid):
    """3DPrinter_Acc_Shopping_Cart -> orders.shopping_carts; product_details ->
    the cart lines; product_property -> kept on the line it describes.

    The cart names its client as client_to_be_billed and is keyed cart_ID; it
    carries no quantity or price (v2 read r.get('id'), which does not exist, so
    every cart landed without a legacy id). The lines are product_details
    (product_ID, shopping_cart_ID, product_type, sub_product_ID, quantity,
    product_status, product_price): v2 loaded them as six catalogue products
    and every cart got one placeholder line at price 0, losing 355 real lines.
    product_property (serial number, warranty and support dates per product_ID)
    is per purchased unit; it is kept in the line's metadata.properties.
    """
    src = "3DPrinter_Acc_Shopping_Cart"
    with Stage(rc, STAGE, legacy=src, target="orders.shopping_carts") as st:
        if not table_exists(my, src):
            st.skip(f"{src} absent")
            return
        cmap = ids.load("UserAcounts", "crm.contacts")
        decode_currency = currency_decoder(my, _currency_by_legacy(pg))
        clear_by_source(pg, "orders.shopping_cart_items", "product_details")
        clear_by_source(pg, "orders.shopping_carts", src)
        with pg.cursor() as cur:
            cur.execute("SELECT id FROM catalog.categories WHERE tenant_id = %s AND legacy_id = 13", (tid,))
            row = cur.fetchone()
            category_id = row["id"] if row else None

        products: dict[str, int] = {}

        def product(kind: str) -> int:
            """One catalogue product per legacy product_type (derived)."""
            if kind not in products:
                with pg.cursor() as cur:
                    cur.execute(
                        """INSERT INTO catalog.sellable_items
                               (tenant_id, category_id, item_kind, fulfilment_kind, code, name,
                                pricing_method, requires_patient, requires_shipping, legacy_source)
                           VALUES (%s, %s, 'product', 'inventory', %s, %s, 'fixed', false, true,
                                   'product_details:product')
                           ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
                           RETURNING id""",
                        (tid, category_id, "printer_" + slugify(kind, "accessory"), kind[:200]))
                    products[kind] = cur.fetchone()["id"]
            return products[kind]

        cart_ids: dict[int, int] = {}
        for r in stream(my, f"SELECT cart_ID, currancy, client_to_be_billed, orderStatus, "
                            f"order_origin, CreatedAt FROM `{src}`"):
            st.read()
            contact_id = cmap.get(str(as_int(r.get("client_to_be_billed"))))
            cart = as_int(r.get("cart_ID"))
            if not contact_id:
                st.exclude(src, "unresolvable_reference", legacy_id=cart,
                           details={"reason": "client_to_be_billed matches no migrated client"})
                continue
            created = as_ts(r.get("CreatedAt"))
            with pg.cursor() as cur:
                cur.execute(
                    """INSERT INTO orders.shopping_carts
                           (tenant_id, contact_id, status, currency_code, created_at,
                            legacy_id, legacy_source)
                       VALUES (%s, %s, 'open', %s, %s, %s, %s) RETURNING id""",
                    (tid, contact_id, decode_currency(r.get("currancy")) or DEFAULT_CURRENCY,
                     created if _epoch_ok(created) else datetime.now(timezone.utc),
                     cart, src))
                # The cart's legacy status and origin travel on each of its lines
                # (shopping_carts has no metadata column).
                cart_ids[cart] = (cur.fetchone()["id"],
                                  {"legacy_order_status": as_int(r.get("orderStatus")),
                                   "legacy_order_origin": as_int(r.get("order_origin"))})
            st.write()
        pg.commit()

    # product_property rows, by the product line they describe.
    props: dict[int, list] = {}
    if table_exists(my, "product_property"):
        for r in stream(my, "SELECT * FROM `product_property` ORDER BY product_property_ID"):
            props.setdefault(as_int(r.get("product_ID")), []).append(
                {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in r.items()
                 if k not in ("CreatedAt",)})

    with Stage(rc, STAGE, legacy="product_details", target="orders.shopping_cart_items") as st:
        if not table_exists(my, "product_details"):
            st.skip("product_details absent")
            return
        attached: set[int] = set()
        with pg.cursor() as cur:
            for r in stream(my, "SELECT * FROM `product_details` ORDER BY product_ID"):
                st.read()
                line = as_int(r.get("product_ID"))
                cart_id, cart_meta = cart_ids.get(as_int(r.get("shopping_cart_ID")), (None, {}))
                if not cart_id:
                    st.exclude("product_details", "unresolvable_reference", legacy_id=line,
                               approval_reference="D-29 owner 2026-10-14",
                               details={"why": "cart not in threeddx3",
                                        "cart": as_int(r.get("shopping_cart_ID"))})
                    continue
                qty = as_int(r.get("quantity")) or 1
                meta = {**cart_meta,
                        "legacy_sub_product_id": as_int(r.get("sub_product_ID")),
                        "legacy_product_status": as_text(r.get("product_status"), 100)}
                if line in props:
                    meta["properties"] = props[line]
                    attached.add(line)
                cur.execute(
                    """INSERT INTO orders.shopping_cart_items
                           (cart_id, sellable_item_id, quantity, unit_price, metadata,
                            legacy_id, legacy_source)
                       VALUES (%s, %s, %s, %s, %s::jsonb, %s, 'product_details')""",
                    (cart_id, product(as_text(r.get("product_type"), 200) or "Accessory"),
                     qty if qty > 0 else 1, as_money(r.get("product_price")) or 0,
                     json.dumps(meta, default=str), line))
                st.write()
        pg.commit()

    with Stage(rc, STAGE, legacy="product_property",
               target="orders.shopping_cart_items.metadata") as st:
        for line, rows in props.items():
            for p in rows:
                st.read()
                if line in attached:
                    st.write()
                else:
                    st.exclude("product_property", "unresolvable_reference",
                               legacy_id=as_int(p.get("product_property_ID")),
                               approval_reference="D-29 owner 2026-10-14",
                               details={"why": "describes a product line that is not in the "
                                               "migrated carts", "product_id": line})


def _exclude_orphan(st, table, legacy_id, order_ref):
    """A child row whose order is not in threeddx3: a deleted parent order
    (owner answer Q21: exclude, do not invent the parent) or, when the order
    reference is empty or 0, a row that never pointed at any order."""
    ref = as_int(order_ref)
    if ref:
        st.exclude(table, "parent_deleted", legacy_id=as_int(legacy_id),
                   approval_reference="Q21 2026-10-12", details={"legacy_order_id": ref})
    else:
        st.exclude(table, "unresolvable_reference", legacy_id=as_int(legacy_id),
                   details={"reason": "order reference empty or 0"})
