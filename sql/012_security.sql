-- ============================================================================
-- 012_security.sql: Role, Hak Akses & Row-Level Security (RLS)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_owner') THEN
    CREATE ROLE erp_owner NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app LOGIN PASSWORD 'erp_app_secret';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_ro') THEN
    CREATE ROLE erp_ro LOGIN PASSWORD 'erp_ro_secret';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_backup') THEN
    CREATE ROLE erp_backup LOGIN PASSWORD 'erp_backup_secret';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO erp_app, erp_ro, erp_backup;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO erp_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO erp_ro, erp_backup;

-- DELETE hanya untuk tabel yang memang boleh dihapus saat DRAFT
GRANT DELETE ON purchase_orders, purchase_order_lines, sorting_orders, sorting_inputs, sorting_outputs, shu_runs, shu_allocations TO erp_app;

-- Ledger: hanya INSERT
REVOKE UPDATE, DELETE ON journal_lines, stock_movements, audit_logs, purchase_prices, sales_prices,
                         quality_checks, delivery_lines, goods_receipt_lines, payment_allocations, sales_return_lines FROM erp_app;
REVOKE UPDATE ON journal_entries FROM erp_app;
GRANT  UPDATE (reversed_by_id) ON journal_entries TO erp_app;

REVOKE ALL ON audit_logs FROM erp_ro;                    -- audit hanya untuk admin
ALTER ROLE erp_app SET lock_timeout = '5s';
ALTER ROLE erp_app SET statement_timeout = '30s';
ALTER ROLE erp_app SET timezone = 'Asia/Jakarta';

-- Row-Level Security untuk role ANGGOTA_READONLY (URS-ACC-010)
ALTER TABLE payables         ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables      ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saprotan_issues  ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['payables','receivables','harvest_receipts','saprotan_issues'] LOOP
    BEGIN
      EXECUTE format($f$CREATE POLICY p_member_scope ON %I
          USING ( NULLIF(current_setting('app.member_id', true), '') IS NULL
                  OR member_id = NULLIF(current_setting('app.member_id', true), '')::bigint )$f$, t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;

