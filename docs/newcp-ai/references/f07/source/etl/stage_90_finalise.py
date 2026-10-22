"""
Stage 90 — finalise.

Recomputes derived values, validates the constraints that were created NOT VALID
so the load could run out of order, refreshes the reporting views, and prints a
reconciliation report comparing MySQL against threeddx3.

If reconciliation finds drift beyond the declared tolerance the run exits
non-zero, so this can gate a scripted cut-over.
"""
from __future__ import annotations

import logging

from etl_core import IdMap, Run, Stage, mysql_count, table_exists

log = logging.getLogger("etl.90_finalise")
STAGE = "90_finalise"

# Reconciliation (v3, queue item 2, accepted 2026-10-13): for every legacy table
#   source rows = rows migrated + rows excluded with a recorded reason
# exactly — no tolerances. "Migrated" counts distinct legacy row identities in
# each target that carries the table's name in legacy_source; "excluded" counts
# audit.migration_exclusions. Tables deliberately not migrated at all carry a
# table-level disposition (config.EXCLUDED_TABLES, mapping_spec.NO_TARGET_REASON,
# mapping_spec.CONSUMED_AS_REFERENCE). Results land in audit.reconciliation_results.

def run(run_ctx: Run, my, pg, ids: IdMap, tid: int) -> bool:
    """Returns True when reconciliation passes."""
    _resolve_catalogue_links(run_ctx, pg)
    _recompute_totals(run_ctx, pg)
    _recompute_contact_dates(run_ctx, pg)
    _backfill_workflow_instances(run_ctx, pg, tid)
    billed_party_ok = _validate_billed_parties(run_ctx, pg)
    _validate_constraints(run_ctx, pg)
    _refresh_views(run_ctx, pg)
    _analyze(run_ctx, pg)
    reconciliation_ok = _reconcile(run_ctx, my, pg)
    return billed_party_ok and reconciliation_ok


def _resolve_catalogue_links(rc, pg):
    # Sleeve/pin selections are loaded by stage 40, the catalogue by stages 05
    # and 85; linking here works whatever order those stages ran in.
    from stage_40_clinical import resolve_sleeve_catalogue
    with Stage(rc, STAGE, legacy="(derived)", target="clinical sleeve/pin catalogue links") as st:
        for k, n in resolve_sleeve_catalogue(pg).items():
            st.messages.append(f"{k}: {n} linked")


def _recompute_totals(rc, pg):
    """Item and order totals, after every item and field value is loaded."""
    with Stage(rc, STAGE, legacy="(derived)", target="orders totals") as st:
        with pg.cursor() as cur:
            cur.execute(
                """UPDATE orders.order_items oi SET
                       fields_amount = COALESCE(v.total, 0),
                       line_total = (oi.unit_price * oi.quantity) + COALESCE(v.total, 0)
                                    - oi.discount_amount - oi.voucher_amount
                   FROM (SELECT order_item_id, sum(charged_amount) AS total
                         FROM orders.order_item_field_values GROUP BY order_item_id) v
                   WHERE v.order_item_id = oi.id""")
            st.write(cur.rowcount)

            # Items with no field values still need line_total set.
            cur.execute(
                """UPDATE orders.order_items SET
                       line_total = (unit_price * quantity) + fields_amount
                                    - discount_amount - voucher_amount
                   WHERE line_total IS DISTINCT FROM
                         ((unit_price * quantity) + fields_amount - discount_amount - voucher_amount)""")
            st.write(cur.rowcount)

            cur.execute(
                """UPDATE orders.orders o SET
                       subtotal_amount = COALESCE(agg.subtotal, 0),
                       discount_amount = COALESCE(agg.discount, 0),
                       voucher_amount  = COALESCE(agg.voucher, 0),
                       total_amount    = COALESCE(agg.subtotal, 0) - COALESCE(agg.discount, 0)
                                       - COALESCE(agg.voucher, 0) + o.adjustment_amount
                   FROM (SELECT order_id,
                                sum((unit_price * quantity) + fields_amount) AS subtotal,
                                sum(discount_amount) AS discount,
                                sum(voucher_amount)  AS voucher
                         FROM orders.order_items WHERE deleted_at IS NULL
                         GROUP BY order_id) agg
                   WHERE agg.order_id = o.id""")
            st.write(cur.rowcount)

            # Orders with no items: totals are zero, not NULL.
            cur.execute(
                """UPDATE orders.orders SET
                       subtotal_amount = 0, discount_amount = 0, voucher_amount = 0,
                       total_amount = adjustment_amount
                   WHERE NOT EXISTS (SELECT 1 FROM orders.order_items i WHERE i.order_id = orders.orders.id)
                     AND total_amount <> adjustment_amount""")
            st.write(cur.rowcount)
        pg.commit()


def _recompute_contact_dates(rc, pg):
    with Stage(rc, STAGE, legacy="(derived)", target="crm.contacts order dates") as st:
        with pg.cursor() as cur:
            cur.execute(
                """UPDATE crm.contacts c SET
                       first_order_at = agg.first_at,
                       last_order_at  = agg.last_at
                   FROM (SELECT contact_id, min(created_at) AS first_at, max(created_at) AS last_at
                         FROM orders.orders WHERE deleted_at IS NULL
                         GROUP BY contact_id) agg
                   WHERE agg.contact_id = c.id""")
            st.write(cur.rowcount)
        pg.commit()


def _backfill_workflow_instances(rc, pg, tid):
    """Give every open order item a workflow instance in ITS OWN flow and state.

    Review finding F05: v2 put every open item into the first definition's
    initial state. v3 places each item using the legacy coordinates stage 30
    recorded in order_items.metadata (legacy_order_type, legacy_is_digital,
    legacy_service_id, legacy_status_id): the service-specific flow when one
    exists (GFMR, serviceID 10), else the order type's general flow; the state
    is whatever workflow.legacy_status_codes decodes the legacy status to in
    that flow. Items that cannot be placed are NOT given a guessed state — they
    are counted and listed, and stay without an instance.
    """
    with Stage(rc, STAGE, legacy="(derived)", target="workflow.workflow_instances") as st:
        with pg.cursor() as cur:
            cur.execute(
                """WITH open_items AS (
                       SELECT oi.id, oi.tenant_id, oi.created_at,
                              (oi.metadata ->> 'legacy_order_type')::int  AS ot,
                              (oi.metadata ->> 'legacy_is_digital')::int  AS dig,
                              COALESCE((oi.metadata ->> 'legacy_flow_service_id')::int, (oi.metadata ->> 'legacy_service_id')::int) AS svc,
                              (oi.metadata ->> 'legacy_status_id')::int   AS status
                       FROM orders.order_items oi
                       WHERE oi.tenant_id = %s AND oi.deleted_at IS NULL
                         AND oi.status NOT IN ('completed', 'cancelled', 'delivered')),
                   placed AS (
                       SELECT i.id, i.tenant_id, i.created_at, d.id AS definition_id, lsc.state_id
                       FROM open_items i
                       JOIN LATERAL (
                           SELECT d.id FROM workflow.workflow_definitions d
                           WHERE d.tenant_id = i.tenant_id AND d.legacy_source = 'OrdersFlow'
                             AND d.legacy_order_type_id = i.ot
                             AND d.legacy_is_digital = (COALESCE(i.dig, 0) = 1)
                             AND (d.legacy_service_id = i.svc OR d.legacy_service_id IS NULL)
                           ORDER BY d.legacy_service_id NULLS LAST      -- service-specific flow first
                           LIMIT 1) d ON true
                       JOIN workflow.legacy_status_codes lsc
                         ON lsc.definition_id = d.id AND lsc.legacy_status_id = i.status)
                   INSERT INTO workflow.workflow_instances
                          (tenant_id, definition_id, entity_type, entity_id, current_state_id, started_at)
                   SELECT tenant_id, definition_id, 'order_item', id, state_id, created_at FROM placed
                   ON CONFLICT (entity_type, entity_id, definition_id, track) DO NOTHING""",
                (tid,))
            st.write(cur.rowcount)
            cur.execute(
                """SELECT count(*) AS n,
                          count(*) FILTER (WHERE oi.metadata ? 'legacy_status_id') AS with_coords
                   FROM orders.order_items oi
                   WHERE oi.tenant_id = %s AND oi.deleted_at IS NULL
                     AND oi.status NOT IN ('completed', 'cancelled', 'delivered')
                     AND NOT EXISTS (SELECT 1 FROM workflow.workflow_instances w
                                     WHERE w.entity_type = 'order_item' AND w.entity_id = oi.id)""",
                (tid,))
            left = cur.fetchone()
            if left["n"]:
                st.skip(f"{left['n']} open items not placed in a workflow "
                        f"({left['with_coords']} had legacy coordinates that decode to no flow/state)",
                        left["n"])
        pg.commit()


def _validate_billed_parties(rc, pg) -> bool:
    """F07 cut-over gate: every item and financial child agrees on the payer.

    The source-domain policy is checked before stage 30. These target-side
    checks prove the resolved contact survived insertion, remained in-tenant,
    and is the contact used by any charge or invoice. Only a clean result makes
    the column NOT NULL and allows the authoritative run to succeed.
    """
    checks = [
        (
            "order items with unresolved billed party",
            """SELECT count(*) FROM orders.order_items
               WHERE billed_to_contact_id IS NULL
                  OR billed_party_origin = 'unresolved_legacy'""",
        ),
        (
            "order items whose billed party is missing or cross-tenant",
            """SELECT count(*)
               FROM orders.order_items oi
               LEFT JOIN crm.contacts c ON c.id = oi.billed_to_contact_id
               WHERE c.id IS NULL OR c.tenant_id IS DISTINCT FROM oi.tenant_id""",
        ),
        (
            "order-default items that do not equal the saved order default",
            """SELECT count(*)
               FROM orders.order_items oi
               JOIN orders.orders o ON o.id = oi.order_id
               WHERE oi.billed_party_origin = 'order_default'
                 AND oi.billed_to_contact_id IS DISTINCT FROM o.contact_id""",
        ),
        (
            "legacy-explicit items without payer provenance",
            """SELECT count(*) FROM orders.order_items oi
               WHERE oi.billed_party_origin = 'legacy_explicit'
                 AND (
                      NOT (oi.metadata ? 'billed_party_migration')
                   OR oi.metadata #>> '{billed_party_migration,source_column}' IS NULL
                   OR oi.metadata #>> '{billed_party_migration,source_raw_value}' IS NULL
                   OR oi.metadata #>> '{billed_party_migration,resolved_role}' IS NULL
                   OR oi.metadata #>> '{billed_party_migration,policy_version}' IS NULL
                 )""",
        ),
        (
            "charges whose contact differs from the order-item payer",
            """SELECT count(*)
               FROM billing.charges ch
               JOIN orders.order_items oi ON oi.id = ch.order_item_id
               WHERE ch.contact_id IS DISTINCT FROM oi.billed_to_contact_id""",
        ),
        (
            "invoice lines whose invoice recipient differs from the item payer",
            """SELECT count(*)
               FROM billing.invoice_lines il
               JOIN billing.invoices inv ON inv.id = il.invoice_id
               JOIN orders.order_items oi ON oi.id = il.order_item_id
               WHERE inv.contact_id IS DISTINCT FROM oi.billed_to_contact_id""",
        ),
        (
            "order items whose direct invoice differs from the item payer",
            """SELECT count(*)
               FROM orders.order_items oi
               JOIN billing.invoices inv ON inv.id = oi.invoice_id
               WHERE inv.contact_id IS DISTINCT FROM oi.billed_to_contact_id""",
        ),
        (
            "invoices containing order items for more than one billed party",
            """SELECT count(*) FROM (
                   SELECT il.invoice_id
                   FROM billing.invoice_lines il
                   JOIN orders.order_items oi ON oi.id = il.order_item_id
                   GROUP BY il.invoice_id
                   HAVING count(DISTINCT oi.billed_to_contact_id) > 1
               ) mixed""",
        ),
    ]

    ok = True
    with Stage(rc, STAGE, legacy="(derived)", target="service billed-party reconciliation") as st:
        with pg.cursor() as cur:
            for label, sql in checks:
                cur.execute(sql)
                count = int(cur.fetchone()["count"])
                st.read()
                if count:
                    ok = False
                    st.skip(f"{label}: {count}", count)
                else:
                    st.write()

            if ok:
                # V204 stays compatible with a pre-existing V3 until every old
                # row is backfilled. The authoritative rebuilt database closes
                # that compatibility window here.
                cur.execute(
                    "ALTER TABLE orders.order_items "
                    "ALTER COLUMN billed_to_contact_id SET NOT NULL"
                )
        pg.commit()
    return ok


def _validate_constraints(rc, pg):
    """v3 creates every constraint VALID on empty tables, so nothing should be
    NOT VALID; v2 left 36 unvalidated (review F01). Report any that are."""
    with Stage(rc, STAGE, legacy="(derived)", target="constraints") as st:
        with pg.cursor() as cur:
            cur.execute("""SELECT conrelid::regclass::text AS t, conname FROM pg_constraint
                           WHERE NOT convalidated AND connamespace::regnamespace::text
                                 NOT IN ('pg_catalog','information_schema')""")
            bad = cur.fetchall()
        st.read(len(bad))
        for r in bad:
            st.skip(f"NOT VALID constraint {r['t']}.{r['conname']}")


def _refresh_views(rc, pg):
    with Stage(rc, STAGE, legacy="(derived)", target="reporting materialized views") as st:
        with pg.cursor() as cur:
            # First refresh cannot be CONCURRENT: the views were created WITH NO DATA.
            cur.execute("SELECT reporting.fn_refresh_materialized_views(false)")
            st.write()
        pg.commit()


def _analyze(rc, pg):
    with Stage(rc, STAGE, legacy="(derived)", target="ANALYZE") as st:
        old_autocommit = pg.autocommit
        pg.commit()
        pg.autocommit = True
        try:
            with pg.cursor() as cur:
                cur.execute("ANALYZE")
            st.write()
        finally:
            pg.autocommit = old_autocommit


def _reconcile(rc, my, pg) -> bool:
    """source = migrated + excluded, per legacy table and target; zero unexplained."""
    from config import EXCLUDED_TABLES
    from mapping_spec import (CONSUMED_AS_REFERENCE, DERIVED_TARGETS, FOLDED_SOURCES,
                              NO_TARGET_REASON)

    cur_my = my.cursor()
    cur_my.execute("""SELECT TABLE_NAME FROM information_schema.TABLES
                      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'""")
    source_tables = sorted(r[0] for r in cur_my.fetchall())
    cur_my.execute("""SELECT TABLE_NAME, count(*) FROM information_schema.KEY_COLUMN_USAGE
                      WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'PRIMARY'
                      GROUP BY TABLE_NAME""")
    pk_width = {t: n for t, n in cur_my.fetchall()}
    cur_my.close()

    with pg.cursor() as cur:
        cur.execute("""SELECT c.table_schema || '.' || c.table_name AS t
                       FROM information_schema.columns c
                       JOIN pg_class k ON k.relname = c.table_name
                       JOIN pg_namespace n ON n.oid = k.relnamespace AND n.nspname = c.table_schema
                       WHERE c.column_name = 'legacy_source' AND NOT k.relispartition
                         AND c.table_schema NOT IN ('public', 'audit')""")
        targets = [r["t"] for r in cur.fetchall()]
        migrated: dict[str, dict[str, tuple[int, int, int]]] = {}
        for t in targets:
            cur.execute(f"""SELECT legacy_source, count(*) AS n,
                                   count(DISTINCT legacy_id) AS ids,
                                   count(DISTINCT COALESCE(legacy_key, legacy_id::text)) AS keys
                            FROM {t} WHERE legacy_source IS NOT NULL GROUP BY legacy_source""")
            for r in cur.fetchall():
                migrated.setdefault(r["legacy_source"], {})[t] = (r["n"], r["ids"], r["keys"])
        # Exclusions accumulate across runs (they are evidence and are never
        # deleted), so a re-run stage records the same rows again: count each
        # keyed source row once. Rows with no key at all come from the latest
        # run that recorded any for that table. pending_owner_decision rows are
        # NOT explanations: they stay unexplained until the owner decides and the
        # decision is written into approval_reference (the only column filled in
        # later, V005).
        cur.execute("""
            WITH keyed AS (
                SELECT legacy_table, count(DISTINCT (legacy_id, legacy_key)) AS n,
                       count(DISTINCT (legacy_id, legacy_key))
                           FILTER (WHERE reason_code = 'pending_owner_decision'
                                     AND approval_reference IS NULL) AS pending
                FROM audit.migration_exclusions
                WHERE legacy_id IS NOT NULL OR legacy_key IS NOT NULL
                GROUP BY 1),
            unkeyed AS (
                SELECT DISTINCT ON (legacy_table) legacy_table, n, pending FROM (
                    SELECT legacy_table, run_id, count(*) AS n,
                           count(*) FILTER (WHERE reason_code = 'pending_owner_decision'
                                              AND approval_reference IS NULL) AS pending,
                           max(id) AS last_id
                    FROM audit.migration_exclusions
                    WHERE legacy_id IS NULL AND legacy_key IS NULL
                    GROUP BY 1, 2) x
                ORDER BY legacy_table, last_id DESC)
            SELECT legacy_table, sum(n) AS n, sum(pending) AS pending
            FROM (SELECT * FROM keyed UNION ALL SELECT * FROM unkeyed) u GROUP BY 1""")
        excluded, pending = {}, {}
        for r in cur.fetchall():
            excluded[r["legacy_table"]] = int(r["n"]) - int(r["pending"])
            pending[r["legacy_table"]] = int(r["pending"])

    # Match a target's legacy_source to the source table by exact name first:
    # the dump has OrderTypes AND orderTypes, and a case-insensitive match
    # counted the rows of one against the other.
    exact_names = set(source_tables)
    lower_targets: dict[str, dict] = {}
    for k, v in migrated.items():
        if k in exact_names:
            lower_targets.setdefault(k.lower() + "\0" + k, v)
        else:
            lower_targets.setdefault(k.lower(), v)

    def targets_of(table):
        return lower_targets.get(table.lower() + "\0" + table) or lower_targets.get(table.lower(), {})

    def union_identity(table, primaries):
        """Distinct legacy ids across several primary targets of one table."""
        key = "COALESCE(legacy_key, legacy_id::text)" if pk_width.get(table, 1) > 1 else "legacy_id::text"
        sql = " UNION ".join(f"SELECT {key} AS k FROM {t} WHERE legacy_source = %s" for t in primaries)
        with pg.cursor() as c2:
            c2.execute(f"SELECT count(DISTINCT k) AS n FROM ({sql}) u WHERE k IS NOT NULL",
                       [table] * len(primaries))
            return c2.fetchone()["n"]
    def also_migrated(table, primaries):
        """Explained exclusions of rows that a primary target holds anyway: a
        merge recorded against a derived target, or an exclusion from an earlier
        run of a row a later run migrated. Such a row is migrated; counting it as
        excluded too would explain it twice."""
        # A composite-key table (SubOrderServices: subOrderID:service:type) is
        # identified by legacy_key; its legacy_id alone names several rows.
        if pk_width.get(table, 1) > 1:
            match, ident = "x.legacy_key = e.legacy_key", "e.legacy_key IS NOT NULL"
        else:
            match, ident = "x.legacy_id = e.legacy_id", "e.legacy_id IS NOT NULL"
        exists = " OR ".join(f"EXISTS (SELECT 1 FROM {t} x WHERE x.legacy_source = %s "
                             f"AND {match})" for t in primaries)
        with pg.cursor() as c2:
            c2.execute(f"""SELECT count(DISTINCT (e.legacy_id, e.legacy_key)) AS n
                            FROM audit.migration_exclusions e
                            WHERE e.legacy_table = %s AND {ident}
                              AND NOT (e.reason_code = 'pending_owner_decision'
                                       AND e.approval_reference IS NULL)
                              AND ({exists})""", [table] + [table] * len(primaries))
            return c2.fetchone()["n"]

    dispositions = {t.lower(): "excluded by the July 2026 workbook (config.EXCLUDED_TABLES)" for t in EXCLUDED_TABLES}
    dispositions.update({t.lower(): "consumed as reference data (mapping_spec.CONSUMED_AS_REFERENCE)" for t in CONSUMED_AS_REFERENCE})
    dispositions.update({t.lower(): f"no target: {r}" for t, r in NO_TARGET_REASON.items()})

    ok = True
    results = []
    with Stage(rc, STAGE, legacy="(all)", target="reconciliation") as st:
        for table in source_tables:
            src = mysql_count(my, table)
            exc = excluded.get(table, 0)
            pend = pending.get(table, 0)
            pairs = targets_of(table)
            st.read()
            if not pairs and table in FOLDED_SOURCES:
                where, sql = FOLDED_SOURCES[table]
                with pg.cursor() as c2:
                    c2.execute(sql)
                    mig = list(c2.fetchone().values())[0]
                note = f"folded into {where}"
                if pend:
                    note += f"; {pend} rows pending an owner decision"
                results.append((table, where, src, mig, exc,
                                "pass" if src - mig - exc == 0 else "fail", note))
                continue
            if not pairs:
                disposition = dispositions.get(table.lower())
                if disposition and table.lower() not in [k.lower() for k in CONSUMED_AS_REFERENCE]:
                    results.append((table, "(not migrated)", src, 0, src, "pass", disposition))
                elif disposition:
                    results.append((table, "(reference)", src, 0, src, "pass", disposition))
                else:
                    unexplained = src - exc
                    status = "pass" if unexplained == 0 else "fail"
                    results.append((table, "(none)", src, 0, exc, status,
                                    None if src == 0 else "no target and no disposition"))
                continue
            primaries = [t for t in pairs if (table, t) not in DERIVED_TARGETS]
            if not primaries and table.lower() not in dispositions:
                # A table reconciled only through derived targets has not been
                # migrated row for row: that is a gap, not a pass.
                results.append((table, "(none)", src, 0, exc, "fail",
                                "only derived targets: " + ", ".join(sorted(pairs))))
            split_identity = union_identity(table, primaries) if len(primaries) > 1 else None
            overlap = also_migrated(table, primaries) if exc and primaries else 0
            exc -= overlap
            for target, (n, ids, keys) in sorted(pairs.items()):
                if (table, target) in DERIVED_TARGETS:
                    results.append((table, target, src, src - exc, exc, "pass",
                                    f"derived ({n} rows): {DERIVED_TARGETS[(table, target)]}"))
                    continue
                # Bulk COPY targets carry legacy_source but no per-row legacy_id:
                # then each target row is one source row and the row count is the
                # identity count.
                identity = keys if pk_width.get(table, 1) > 1 else ids
                if identity == 0 and n > 0:
                    identity = n
                note = None if n == identity else f"{n} target rows for {identity} source identities (fan-out)"
                if split_identity is not None:
                    note = (f"split over {len(primaries)} targets ({', '.join(sorted(primaries))}): "
                            f"{split_identity} distinct source rows in all; this target holds {identity}")
                    identity = split_identity
                if overlap:
                    note = ((note + "; " if note else "") + f"{overlap} excluded rows are migrated "
                            f"anyway (derived-target merge or earlier run); counted once, as migrated")
                if pend:
                    note = (note + "; " if note else "") + f"{pend} rows pending an owner decision"
                status = "pass" if src - identity - exc == 0 else "fail"
                results.append((table, target, src, identity, exc, status, note))

        with pg.cursor() as cur:
            for table, target, src, mig, exc, status, note in results:
                # A fan-out target can hold MORE identities than the source (a
                # row per department, per currency…): that is a defect only if it
                # is not deliberate, so it is reported, not clamped.
                unexplained = src - mig - exc
                cur.execute(
                    """INSERT INTO audit.reconciliation_results
                           (run_id, legacy_table, target_table, source_count, migrated_count,
                            excluded_count, unexplained_count, status, notes)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (run_id, legacy_table, target_table) DO UPDATE
                           SET source_count = EXCLUDED.source_count, migrated_count = EXCLUDED.migrated_count,
                               excluded_count = EXCLUDED.excluded_count,
                               unexplained_count = EXCLUDED.unexplained_count,
                               status = EXCLUDED.status, notes = EXCLUDED.notes""",
                    (rc.run_id, table, target, src, mig, exc, unexplained,
                     "pass" if unexplained == 0 else "fail", note))
                if unexplained == 0:
                    st.write()
                else:
                    ok = False
                    st.skip(f"{table} -> {target}: {src} source, {mig} migrated, {exc} excluded, "
                            f"{unexplained} unexplained")
        pg.commit()

    log.info("Reconciliation: %d table/target pairs, %d fail",
             len(results), sum(1 for r in results if r[2] - r[3] - r[4] != 0))
    _integrity_checks(pg)
    log.info("Reconciliation %s", "PASSED" if ok else "FAILED")
    return ok


def _integrity_checks(pg):
    """Business invariants that a row count cannot catch."""
    checks = [
        ("orders with no items",
         "SELECT count(*) FROM orders.orders o "
         "WHERE NOT EXISTS (SELECT 1 FROM orders.order_items i WHERE i.order_id = o.id)"),
        ("order items whose order is missing",
         "SELECT count(*) FROM orders.order_items i "
         "LEFT JOIN orders.orders o ON o.id = i.order_id WHERE o.id IS NULL"),
        ("contacts with no legacy_id",
         "SELECT count(*) FROM crm.contacts WHERE legacy_id IS NULL"),
        ("users with no legacy_id",
         "SELECT count(*) FROM iam.users WHERE legacy_id IS NULL AND party_kind <> 'service'"),
        ("vouchers with a negative balance",
         "SELECT count(*) FROM vouchers.vouchers WHERE remaining_credit < 0"),
        ("voucher ledger vs balance mismatch",
         "SELECT count(*) FROM vouchers.vouchers v WHERE v.remaining_credit <> "
         "v.issued_credit - v.consumed_credit - v.expired_credit - v.refunded_credit"),
        ("orders whose total does not match its items",
         "SELECT count(*) FROM orders.orders o WHERE o.total_amount <> "
         "o.subtotal_amount - o.discount_amount - o.voucher_amount + o.adjustment_amount"),
        ("archive packages with no items",
         "SELECT count(*) FROM archive.packages p "
         "WHERE NOT EXISTS (SELECT 1 FROM archive.package_items i WHERE i.package_id = p.id)"),
        ("tooth charts with no sites",
         "SELECT count(*) FROM clinical.tooth_charts c "
         "WHERE NOT EXISTS (SELECT 1 FROM clinical.tooth_sites s WHERE s.tooth_chart_id = c.id)"),
        ("orders with more than one active lock",
         "SELECT count(*) FROM (SELECT order_id FROM orders.order_locks "
         "WHERE status = 'active' GROUP BY order_id HAVING count(*) > 1) x"),
    ]
    log.info("")
    log.info("Integrity checks")
    with pg.cursor() as cur:
        for label, sql in checks:
            cur.execute(sql)
            n = cur.fetchone()["count"]
            log.info("  %-48s %10s", label, f"{n:,}")
