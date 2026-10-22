-- =============================================================================
-- V130  Ownership, row-level security, grants, PHI and login gateways
-- =============================================================================
-- Design (analysis/V3_DESIGN.md §C):
--  * Every object is owned by threeddx3_owner (NOLOGIN). The owner has BYPASSRLS
--    so its SECURITY DEFINER gateways (login lookup, PHI access, audit writer)
--    work before a tenant is known; every such function and view therefore
--    filters the tenant EXPLICITLY. Runtime tests prove it.
--  * RLS is ENABLED and FORCED on every tenant-scoped table. One policy:
--    tenant_id = core.fn_current_tenant(). Unset tenant -> NULL -> no rows
--    (fail-closed; v2's "OR tenant IS NULL" branch is gone — review F01).
--  * Partitions are never granted: they are reachable only through their parent,
--    so the parent's policy always applies.
--  * PHI identity (clinical.patient_identities) is granted to nobody but the
--    owner; app and read roles reach it only through logged functions.
--  * PUBLIC has nothing.
-- =============================================================================

ALTER ROLE threeddx3_owner BYPASSRLS;

-- ------------------------------------------------------------ 1. ownership
DO $$
DECLARE
    r record;
    v_schemas text[] := ARRAY['core','audit','iam','crm','catalog','pricing','clinical','orders','vouchers',
                              'workflow','collaboration','production','quality','inventory','archive','shipping',
                              'billing','docs','comms','integration','reporting','compliance','platform'];
BEGIN
    FOR r IN SELECT n.nspname, c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = ANY (v_schemas) AND c.relkind IN ('r','p','v','m','S')
               AND NOT (c.relkind = 'S' AND EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'i'))
    LOOP
        EXECUTE format('ALTER %s %I.%I OWNER TO threeddx3_owner',
                       CASE r.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' WHEN 'S' THEN 'SEQUENCE' ELSE 'TABLE' END,
                       r.nspname, r.relname);
    END LOOP;
    FOR r IN SELECT p.oid::regprocedure AS f FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = ANY (v_schemas)
               AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
    LOOP
        EXECUTE format('ALTER FUNCTION %s OWNER TO threeddx3_owner', r.f);
    END LOOP;
    FOR r IN SELECT n.nspname, t.typname, t.typtype FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
             WHERE n.nspname = ANY (v_schemas) AND t.typtype IN ('d','e')
    LOOP
        EXECUTE format('ALTER %s %I.%I OWNER TO threeddx3_owner',
                       CASE r.typtype WHEN 'd' THEN 'DOMAIN' ELSE 'TYPE' END, r.nspname, r.typname);
    END LOOP;
END
$$;
ALTER TABLE public.schema_migrations OWNER TO threeddx3_owner;

-- ------------------------------------------------- 2. row-level security
DO $$
DECLARE
    r record;
    v_global_read text[] := ARRAY['core.lookup_values', 'platform.feature_flags'];   -- tenant_id NULL = shared by all tenants
BEGIN
    FOR r IN
        SELECT n.nspname AS s, c.relname AS t, a.attnotnull AS tenant_required
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
        WHERE c.relkind IN ('r','p') AND NOT c.relispartition
          AND n.nspname NOT IN ('public','pg_catalog','information_schema')
        ORDER BY 1, 2
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.s, r.t);
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.s, r.t);
        EXECUTE format('CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR ALL '
                       'USING (tenant_id = core.fn_current_tenant()) WITH CHECK (tenant_id = core.fn_current_tenant())',
                       'pol_' || r.t || '__tenant_isolation', r.s, r.t);
        EXECUTE format('COMMENT ON POLICY %I ON %I.%I IS %L', 'pol_' || r.t || '__tenant_isolation', r.s, r.t,
                       'Tenant isolation: a session sees and writes only rows of the tenant in app.tenant_id. '
                       'Unset tenant = no rows (fail-closed). Roles with BYPASSRLS (owner, migrator, admin, backup) are not filtered.');
        IF (r.s || '.' || r.t) = ANY (v_global_read) THEN
            EXECUTE format('CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR SELECT USING (tenant_id IS NULL)',
                           'pol_' || r.t || '__global_read', r.s, r.t);
            EXECUTE format('COMMENT ON POLICY %I ON %I.%I IS %L', 'pol_' || r.t || '__global_read', r.s, r.t,
                           'Rows with tenant_id NULL are shared vocabulary/flags readable by every tenant; only the owner writes them.');
        END IF;
    END LOOP;
END
$$;

-- --------------------------------------------------------------- 3. grants
REVOKE ALL ON SCHEMA core, audit, iam, crm, catalog, pricing, clinical, orders, vouchers, workflow, collaboration,
                     production, quality, inventory, archive, shipping, billing, docs, comms, integration,
                     reporting, compliance, platform FROM PUBLIC;
GRANT USAGE ON SCHEMA core, iam, crm, catalog, pricing, clinical, orders, vouchers, workflow, collaboration,
                      production, quality, inventory, archive, shipping, billing, docs, comms, integration,
                      reporting, compliance, platform
      TO threeddx3_app_rw, threeddx3_read;
GRANT USAGE ON SCHEMA audit TO threeddx3_app_rw;   -- functions only; no table grants
GRANT USAGE ON SCHEMA core, audit, iam, crm, catalog, pricing, clinical, orders, vouchers, workflow, collaboration,
                      production, quality, inventory, archive, shipping, billing, docs, comms, integration,
                      reporting, compliance, platform
      TO threeddx3_backup;

DO $$
DECLARE
    r record;
    v_app_schemas text[] := ARRAY['core','iam','crm','catalog','pricing','clinical','orders','vouchers','workflow',
                                  'collaboration','production','quality','inventory','archive','shipping','billing',
                                  'docs','comms','integration','reporting','compliance','platform'];
    -- never granted to app/read: PHI identity, secret material, the schema's own sensitivity register is read-only
    v_no_grant text[] := ARRAY['clinical.patient_identities'];
    v_read_excluded text[] := ARRAY['clinical.patient_identities', 'iam.password_history', 'iam.password_resets',
                                    'iam.user_sessions'];
    v_app_read_only text[] := ARRAY['compliance.data_classifications', 'core.tenants', 'core.currencies',
                                    'core.countries', 'core.regions', 'iam.capabilities', 'catalog.field_types',
                                    'docs.file_types', 'docs.file_sources', 'compliance.regimes',
                                    'clinical.shade_systems', 'clinical.shade_values', 'integration.providers'];
BEGIN
    FOR r IN SELECT n.nspname AS s, c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relkind IN ('r','p','v') AND NOT c.relispartition AND n.nspname = ANY (v_app_schemas)
               -- materialized views (relkind 'm') carry no RLS and are never granted: read their v_ wrappers
    LOOP
        CONTINUE WHEN (r.s || '.' || r.t) = ANY (v_no_grant);
        IF (r.s || '.' || r.t) = ANY (v_app_read_only) THEN
            EXECUTE format('GRANT SELECT ON %I.%I TO threeddx3_app_rw', r.s, r.t);
        ELSE
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.%I TO threeddx3_app_rw', r.s, r.t);
        END IF;
        IF NOT (r.s || '.' || r.t) = ANY (v_read_excluded) THEN
            EXECUTE format('GRANT SELECT ON %I.%I TO threeddx3_read', r.s, r.t);
        END IF;
    END LOOP;
    FOR r IN SELECT n.nspname AS s FROM pg_namespace n WHERE n.nspname = ANY (v_app_schemas) LOOP
        EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO threeddx3_app_rw', r.s);
    END LOOP;
END
$$;

-- Secret columns hidden from the read role even where the table is readable.
REVOKE SELECT ON iam.users, iam.api_clients, orders.confirmation_links FROM threeddx3_read;
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT table_schema, table_name, string_agg(quote_ident(column_name), ', ') AS cols
             FROM information_schema.columns
             WHERE (table_schema, table_name) IN (('iam','users'), ('iam','api_clients'), ('orders','confirmation_links'))
               AND column_name NOT IN ('password_hash', 'secret_hash', 'token_hash')
             GROUP BY 1, 2
    LOOP
        EXECUTE format('GRANT SELECT (%s) ON %I.%I TO threeddx3_read', r.cols, r.table_schema, r.table_name);
    END LOOP;
END
$$;

-- Functions: nothing for PUBLIC; app may call all business functions; read gets helpers.
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT p.oid::regprocedure AS f, n.nspname AS s FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname IN ('core','audit','iam','crm','catalog','pricing','clinical','orders','vouchers','workflow',
                                 'collaboration','production','quality','inventory','archive','shipping','billing','docs',
                                 'comms','integration','reporting','compliance','platform')
               AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.f);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO threeddx3_app_rw', r.f);
    END LOOP;
END
$$;
GRANT EXECUTE ON FUNCTION core.fn_current_tenant(), core.fn_current_user_id(), core.fn_current_role_id(),
                          core.fn_current_request_id(), core.fn_set_tenant(text), core.fn_set_user(bigint, bigint, text),
                          core.fn_add_business_hours(bigint, timestamptz, numeric),
                          clinical.fn_universal_to_fdi(smallint), clinical.fn_fdi_to_universal(core.fdi_tooth),
                          pricing.fn_quote_total(bigint, bigint, jsonb, jsonb, boolean),
                          -- fn_quote_total is SECURITY INVOKER: the caller needs its callees too
                          pricing.fn_quote_line(bigint, bigint, jsonb, jsonb, boolean),
                          pricing.fn_select_formula(bigint, bigint, jsonb),
                          pricing.fn_condition_holds(pricing.formula_conditions, jsonb)
      TO threeddx3_read;

-- Default privileges for objects created later by the owner.
DO $$
DECLARE
    s text;
BEGIN
    FOREACH s IN ARRAY ARRAY['core','iam','crm','catalog','pricing','clinical','orders','vouchers','workflow',
                             'collaboration','production','quality','inventory','archive','shipping','billing','docs',
                             'comms','integration','reporting','compliance','platform']
    LOOP
        EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE threeddx3_owner IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO threeddx3_app_rw', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE threeddx3_owner IN SCHEMA %I GRANT SELECT ON TABLES TO threeddx3_read', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE threeddx3_owner IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO threeddx3_app_rw', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE threeddx3_owner IN SCHEMA %I REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC', s);
    END LOOP;
END
$$;

-- --------------------------------------------------- 4. login gateway (pre-tenant)
CREATE FUNCTION iam.fn_find_login_user(p_email text)
    RETURNS TABLE (user_id bigint, tenant_id bigint, tenant_slug text, party_kind varchar, password_hash varchar,
                   password_algo varchar, must_change_password boolean, password_expires_at timestamptz, state varchar)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
    SELECT u.id, u.tenant_id, t.slug::text, u.party_kind, u.password_hash, u.password_algo, u.must_change_password,
           u.password_expires_at, u.state::varchar
    FROM iam.users u JOIN core.tenants t ON t.id = u.tenant_id
    WHERE u.email = p_email::core.email_address AND u.deleted_at IS NULL AND t.deleted_at IS NULL;
$$;
COMMENT ON FUNCTION iam.fn_find_login_user(text) IS 'Login gateway: returns the account(s) for an e-mail across tenants, with the password hash to verify, before any tenant is set (iam.users is under fail-closed RLS). SECURITY DEFINER owned by threeddx3_owner; executable by the app role only. The caller must record the outcome with audit.fn_log_event(''login_success''|''login_failure'', …). Migrated users have no hash and must_change_password = true: they log in only through a reset (user decision U3).';

-- --------------------------------------------- 5. application event logging
CREATE FUNCTION audit.fn_log_event(p_event_code text, p_target_schema text DEFAULT NULL, p_target_table text DEFAULT NULL,
                                   p_target_record_id bigint DEFAULT NULL, p_details jsonb DEFAULT '{}'::jsonb,
                                   p_subject_user_id bigint DEFAULT NULL, p_client_addr inet DEFAULT NULL,
                                   p_user_agent text DEFAULT NULL)
    RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    v_id bigint;
BEGIN
    INSERT INTO audit.event_log (occurred_at, tenant_id, event_code, actor_user_id, actor_role_id, db_role,
                                 subject_user_id, target_schema, target_table, target_record_id, details,
                                 request_id, session_id, client_addr, user_agent)
    VALUES (now(), core.fn_current_tenant(), p_event_code, core.fn_current_user_id(), core.fn_current_role_id(),
            session_user, p_subject_user_id, p_target_schema, p_target_table, p_target_record_id,
            COALESCE(p_details, '{}'::jsonb), core.fn_current_request_id(), pg_backend_pid()::text,
            COALESCE(p_client_addr, inet_client_addr()), p_user_agent)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;
COMMENT ON FUNCTION audit.fn_log_event(text, text, text, bigint, jsonb, bigint, inet, text) IS 'The only way applications write audit.event_log (no table grant): logins and failures, logouts, password events, permission and role changes, exports, deletions, break-glass, consent and signature events (event_code from ck_event_log__event_code). Actor, role, request id and session come from the session context. Details must not contain PHI.';

-- ------------------------------------------------------ 6. PHI access gateway
CREATE FUNCTION clinical.fn_get_patient_identity(p_patient_id bigint, p_purpose text)
    RETURNS SETOF clinical.patient_identities
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    v_tenant bigint := core.fn_current_tenant();
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'PHI access requires a tenant (app.tenant_id)' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF p_purpose IS NULL OR btrim(p_purpose) = '' THEN
        RAISE EXCEPTION 'PHI access requires a stated purpose' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    INSERT INTO audit.phi_access_log (occurred_at, tenant_id, actor_user_id, actor_role_id, db_role, patient_id,
                                      accessed_columns, purpose, function_name, request_id, session_id, client_addr)
    SELECT now(), v_tenant, core.fn_current_user_id(), core.fn_current_role_id(), session_user, pi.patient_id,
           ARRAY['full_name','given_name','family_name','date_of_birth','sex','external_mrn','dicom_patient_id','notes'],
           p_purpose, 'clinical.fn_get_patient_identity', core.fn_current_request_id(), pg_backend_pid()::text, inet_client_addr()
    FROM clinical.patient_identities pi WHERE pi.patient_id = p_patient_id AND pi.tenant_id = v_tenant;
    RETURN QUERY SELECT pi.* FROM clinical.patient_identities pi
                 WHERE pi.patient_id = p_patient_id AND pi.tenant_id = v_tenant;
END;
$$;
COMMENT ON FUNCTION clinical.fn_get_patient_identity(bigint, text) IS 'HIPAA minimum-necessary gateway to one patient''s identity (name, DOB, sex, MRN, DICOM id). Requires a tenant and a stated purpose; returns only the current tenant''s patient; every successful call writes audit.phi_access_log (who, role, patient, purpose, request). The base table is never granted to app or read roles.';

CREATE FUNCTION clinical.fn_list_patient_identities(p_patient_ids bigint[], p_purpose text)
    RETURNS SETOF clinical.patient_identities
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    v_tenant bigint := core.fn_current_tenant();
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'PHI access requires a tenant (app.tenant_id)' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF p_purpose IS NULL OR btrim(p_purpose) = '' THEN
        RAISE EXCEPTION 'PHI access requires a stated purpose' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF cardinality(p_patient_ids) > 500 THEN
        RAISE EXCEPTION 'At most 500 patients per call (got %)', cardinality(p_patient_ids) USING ERRCODE = 'program_limit_exceeded';
    END IF;
    INSERT INTO audit.phi_access_log (occurred_at, tenant_id, actor_user_id, actor_role_id, db_role, patient_id,
                                      accessed_columns, purpose, function_name, request_id, session_id, client_addr)
    SELECT now(), v_tenant, core.fn_current_user_id(), core.fn_current_role_id(), session_user, pi.patient_id,
           ARRAY['full_name','given_name','family_name','date_of_birth','sex','external_mrn','dicom_patient_id','notes'],
           p_purpose, 'clinical.fn_list_patient_identities', core.fn_current_request_id(), pg_backend_pid()::text, inet_client_addr()
    FROM clinical.patient_identities pi WHERE pi.patient_id = ANY (p_patient_ids) AND pi.tenant_id = v_tenant;
    RETURN QUERY SELECT pi.* FROM clinical.patient_identities pi
                 WHERE pi.patient_id = ANY (p_patient_ids) AND pi.tenant_id = v_tenant;
END;
$$;
COMMENT ON FUNCTION clinical.fn_list_patient_identities(bigint[], text) IS 'Bulk form of fn_get_patient_identity for list screens: up to 500 patients per call, current tenant only, purpose required, one audit.phi_access_log row per patient returned.';

-- ------------------------------------------------- 7. re-own and re-grant new objects
ALTER FUNCTION iam.fn_find_login_user(text) OWNER TO threeddx3_owner;
ALTER FUNCTION audit.fn_log_event(text, text, text, bigint, jsonb, bigint, inet, text) OWNER TO threeddx3_owner;
ALTER FUNCTION clinical.fn_get_patient_identity(bigint, text) OWNER TO threeddx3_owner;
ALTER FUNCTION clinical.fn_list_patient_identities(bigint[], text) OWNER TO threeddx3_owner;
REVOKE ALL ON FUNCTION iam.fn_find_login_user(text), audit.fn_log_event(text, text, text, bigint, jsonb, bigint, inet, text),
                       clinical.fn_get_patient_identity(bigint, text), clinical.fn_list_patient_identities(bigint[], text)
       FROM PUBLIC;
GRANT EXECUTE ON FUNCTION iam.fn_find_login_user(text), audit.fn_log_event(text, text, text, bigint, jsonb, bigint, inet, text),
                          clinical.fn_get_patient_identity(bigint, text), clinical.fn_list_patient_identities(bigint[], text)
      TO threeddx3_app_rw;
