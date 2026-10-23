-- =============================================================================
-- V002  Domains and enumerated types shared across schemas
-- =============================================================================
-- Domains carry a rule that must hold wherever the concept appears (a currency
-- code is three capital letters everywhere). ENUM types are used only for small
-- closed technical sets that v2 already used and the ETL writes as literals;
-- business vocabularies that may grow are varchar + named CHECK in the table
-- files instead (SCHEMA_CONVENTIONS.md section 3).
-- =============================================================================

-- ---------------------------------------------------------------- domains
CREATE DOMAIN core.currency_code AS char(3)
    CONSTRAINT ck_currency_code__iso4217_shape CHECK (VALUE ~ '^[A-Z]{3}$');
COMMENT ON DOMAIN core.currency_code IS 'ISO 4217 alphabetic currency code (USD, EUR, GBP, EGP). Three capital letters; the code must also exist in core.currencies where a column has an FK.';
COMMENT ON CONSTRAINT ck_currency_code__iso4217_shape ON DOMAIN core.currency_code IS 'A currency code is exactly three capital letters A-Z (ISO 4217 alphabetic form); symbols such as "$" stored by legacy Orders.Currency are decoded by the ETL, never stored.';

CREATE DOMAIN core.email_address AS public.citext
    CONSTRAINT ck_email_address__shape CHECK (VALUE OPERATOR(public.~) '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
COMMENT ON DOMAIN core.email_address IS 'E-mail address compared case-insensitively. Format check only (one @, a dot in the domain, no spaces); deliverability is tracked in comms.email_suppressions. [PII]';
COMMENT ON CONSTRAINT ck_email_address__shape ON DOMAIN core.email_address IS 'An e-mail address has exactly one local part and one domain containing a dot, with no whitespace; legacy values that fail (e.g. "judi@pal.ne@coxmail.com") are rejected by the ETL coercion into the rejects file, not stored.';

CREATE DOMAIN core.entity_code AS varchar(100)
    CONSTRAINT ck_entity_code__slug CHECK (VALUE ~ '^[a-z0-9][a-z0-9_.-]*$');
COMMENT ON DOMAIN core.entity_code IS 'Stable machine code for a configurable thing (category, service, field, state, lookup value): lower-case ASCII letters, digits, underscore, dot, hyphen. Codes are referenced by application code and never re-used for a different meaning.';
COMMENT ON CONSTRAINT ck_entity_code__slug ON DOMAIN core.entity_code IS 'Codes are ASCII slugs starting with a letter or digit, so they are safe in URLs, file names and code without escaping.';

CREATE DOMAIN core.fdi_tooth AS smallint
    CONSTRAINT ck_fdi_tooth__range CHECK (VALUE BETWEEN 11 AND 85 AND VALUE % 10 BETWEEN 1 AND 8);
COMMENT ON DOMAIN core.fdi_tooth IS 'Tooth number in FDI two-digit notation: quadrant 1-4 permanent (11-48), 5-8 deciduous (51-85); second digit 1-8 (1-5 for deciduous is enforced by the converter functions). Universal (1-32) and Palmer numbering are converted at the API edge by clinical.fn_universal_to_fdi / fn_fdi_to_universal.';
COMMENT ON CONSTRAINT ck_fdi_tooth__range ON DOMAIN core.fdi_tooth IS 'A tooth number is a valid FDI code: 11-85 with a position digit 1-8, so 10, 19, 20 or 90 cannot be stored.';

CREATE DOMAIN core.money_amount AS numeric(15,4);
COMMENT ON DOMAIN core.money_amount IS 'Monetary amount with four decimal places (enough for unit prices and exchange-rate conversion before rounding to cents). Signed: sign rules (non-negative prices, negative credits) are CHECKs on each column. Always paired with a currency on the same row or a stated source of the currency. [FINANCIAL]';

CREATE DOMAIN core.rate_percent AS numeric(7,4)
    CONSTRAINT ck_rate_percent__0_100 CHECK (VALUE BETWEEN 0 AND 100);
COMMENT ON DOMAIN core.rate_percent IS 'Percentage expressed 0-100 with four decimals (12.5 = 12.5 %). Used for discounts and allocation shares; tax rates use a 0-1 fraction instead.';
COMMENT ON CONSTRAINT ck_rate_percent__0_100 ON DOMAIN core.rate_percent IS 'A percentage is between 0 and 100 inclusive; a discount above 100 % or below 0 % is a data error.';

CREATE DOMAIN core.sha256_hex AS char(64)
    CONSTRAINT ck_sha256_hex__shape CHECK (VALUE ~ '^[0-9a-f]{64}$');
COMMENT ON DOMAIN core.sha256_hex IS 'SHA-256 digest as 64 lower-case hexadecimal characters: content hashes of files and regulated records, audit chain hashes, token hashes.';
COMMENT ON CONSTRAINT ck_sha256_hex__shape ON DOMAIN core.sha256_hex IS 'A SHA-256 digest is exactly 64 lower-case hex characters.';

-- ---------------------------------------------------------------- closed enums (kept from v2)
CREATE TYPE core.actor_kind AS ENUM ('user', 'system', 'integration', 'anonymous');
COMMENT ON TYPE core.actor_kind IS 'Who performed an action: ''user'' = a logged-in person (staff or portal user); ''system'' = a scheduled job, trigger or the migration; ''integration'' = an external system through its API client or webhook; ''anonymous'' = an unauthenticated request (public confirmation link, unsubscribe).';

CREATE TYPE core.lifecycle_state AS ENUM ('draft', 'active', 'suspended', 'deprecated', 'archived');
COMMENT ON TYPE core.lifecycle_state IS 'Lifecycle of configurable master data: ''draft'' = being prepared, not selectable; ''active'' = in use; ''suspended'' = temporarily unavailable, history intact; ''deprecated'' = no new use, existing references valid; ''archived'' = retained for history only.';

CREATE TYPE catalog.item_kind AS ENUM ('service', 'product', 'license', 'rental', 'bundle');
COMMENT ON TYPE catalog.item_kind IS 'What a sellable item is: ''service'' = design/planning/production work done per case; ''product'' = a physical good from stock (printer, resin, kit); ''license'' = software entitlement; ''rental'' = loaner equipment with a return; ''bundle'' = a package of other items.';

CREATE TYPE catalog.fulfilment_kind AS ENUM ('production', 'inventory', 'licensing', 'rental', 'manual', 'none');
COMMENT ON TYPE catalog.fulfilment_kind IS 'How an item is delivered: ''production'' = made per order by production; ''inventory'' = picked from stock; ''licensing'' = a licence is issued; ''rental'' = a unit is lent and returned; ''manual'' = handled outside the system; ''none'' = nothing to deliver (fees).';

CREATE TYPE inventory.movement_kind AS ENUM ('receipt', 'issue', 'return', 'adjustment', 'transfer', 'write_off');
COMMENT ON TYPE inventory.movement_kind IS 'Stock movement: ''receipt'' = goods in; ''issue'' = goods out to an order or use; ''return'' = goods back from a client; ''adjustment'' = stock-count correction; ''transfer'' = between locations; ''write_off'' = scrapped or lost.';

CREATE TYPE orders.lock_source AS ENUM ('user', 'system');
COMMENT ON TYPE orders.lock_source IS 'Who took an order lock: ''user'' = a staff member opened the order for editing; ''system'' = a process (charging, invoicing) locked it.';

CREATE TYPE orders.lock_status AS ENUM ('active', 'released', 'expired');
COMMENT ON TYPE orders.lock_status IS 'Order lock state: ''active'' = held, edits by others rejected; ''released'' = closed by its holder; ''expired'' = timed out and released by the system.';

CREATE TYPE shipping.direction AS ENUM ('outbound', 'inbound', 'return');
COMMENT ON TYPE shipping.direction IS 'Shipment direction: ''outbound'' = 3DDX to client; ''inbound'' = client to 3DDX (models, impressions); ''return'' = goods coming back (loaner kits, remakes).';

CREATE TYPE vouchers.txn_kind AS ENUM ('issue', 'redeem', 'refund', 'adjust', 'expire', 'reinstate', 'transfer');
COMMENT ON TYPE vouchers.txn_kind IS 'Voucher ledger movement: ''issue'' = credit granted; ''redeem'' = credit consumed by an order item; ''refund'' = consumed credit returned; ''adjust'' = reconciliation correction (e.g. voucher_fill adjustment rows); ''expire'' = unused credit lapsed; ''reinstate'' = lapsed credit restored; ''transfer'' = moved to another voucher.';

CREATE TYPE workflow.task_state AS ENUM ('open', 'in_progress', 'blocked', 'done', 'cancelled');
COMMENT ON TYPE workflow.task_state IS 'Task state: ''open'' = created, not started; ''in_progress'' = being worked; ''blocked'' = waiting on someone else; ''done'' = completed (requires a close reason where configured); ''cancelled'' = no longer needed.';
