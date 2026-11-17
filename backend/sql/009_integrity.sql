-- ============================================================================
-- 009_integrity.sql: Fungsi & Trigger Integritas Sistem ERP Smart Farming
-- ============================================================================

-- 6.1 Utilitas: updated_at otomatis
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns
           WHERE table_schema = 'public' AND column_name = 'updated_at'
  LOOP
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- 6.2 Immutability (SRS-NFR-004, URS-NFR-004)
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_DOCUMENT: % tidak boleh di-% (gunakan dokumen pembalik)', TG_TABLE_NAME, TG_OP;
END; $$ LANGUAGE plpgsql;

-- Tabel append-only: tidak boleh UPDATE maupun DELETE
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['journal_lines','stock_movements','audit_logs','purchase_prices','sales_prices',
                           'quality_checks','delivery_lines','goods_receipt_lines','payment_allocations','sales_return_lines']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_immutable BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION forbid_mutation()', t);
  END LOOP;
END $$;

-- Jurnal: hanya kolom reversed_by_id yang boleh diisi (sekali); DELETE dilarang
CREATE OR REPLACE FUNCTION journal_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'IMMUTABLE_DOCUMENT: jurnal tidak boleh dihapus'; END IF;
  IF OLD.reversed_by_id IS NOT NULL
     OR (to_jsonb(NEW) - 'reversed_by_id') IS DISTINCT FROM (to_jsonb(OLD) - 'reversed_by_id') THEN
    RAISE EXCEPTION 'IMMUTABLE_DOCUMENT: jurnal hanya dapat dibalik, bukan diubah';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_journal_guard BEFORE UPDATE OR DELETE ON journal_entries FOR EACH ROW EXECUTE FUNCTION journal_guard();

-- Dokumen berstatus: DELETE hanya boleh pada DRAFT/PROPOSED
CREATE OR REPLACE FUNCTION forbid_delete_posted() RETURNS trigger AS $$
BEGIN
  IF OLD.status NOT IN ('DRAFT','PROPOSED') THEN
    RAISE EXCEPTION 'IMMUTABLE_DOCUMENT: % berstatus % tidak boleh dihapus', TG_TABLE_NAME, OLD.status;
  END IF;
  RETURN OLD;
END; $$ LANGUAGE plpgsql;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['harvest_receipts','goods_receipts','sorting_orders','sales_orders','delivery_orders',
                           'sales_invoices','sales_returns','purchase_orders','saprotan_issues','stock_adjustments',
                           'stock_transfers','payables','receivables']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_nodelete BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION forbid_delete_posted()', t);
  END LOOP;
END $$;

-- Anak order sortasi: tidak boleh ditambah/dihapus bila order sudah bukan DRAFT
CREATE OR REPLACE FUNCTION guard_sorting_children() RETURNS trigger AS $$
DECLARE v_order BIGINT; v_status TEXT;
BEGIN
  IF TG_TABLE_NAME = 'sorting_inputs' THEN
    v_order := COALESCE(NEW.order_id, OLD.order_id);
  ELSE
    SELECT i.order_id INTO v_order FROM sorting_inputs i WHERE i.id = COALESCE(NEW.input_id, OLD.input_id);
  END IF;
  SELECT status INTO v_status FROM sorting_orders WHERE id = v_order;
  IF v_status IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION 'IMMUTABLE_DOCUMENT: order sortasi % berstatus %', v_order, v_status;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_guard_sin  BEFORE INSERT OR DELETE ON sorting_inputs  FOR EACH ROW EXECUTE FUNCTION guard_sorting_children();
CREATE TRIGGER trg_guard_sout BEFORE INSERT OR UPDATE OR DELETE ON sorting_outputs FOR EACH ROW EXECUTE FUNCTION guard_sorting_children();

-- 6.3 Akuntansi
-- Jurnal seimbang (dicek saat COMMIT)
CREATE OR REPLACE FUNCTION check_journal_balanced() RETURNS trigger AS $$
DECLARE d NUMERIC; c NUMERIC;
BEGIN
  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0) INTO d, c FROM journal_lines WHERE entry_id = NEW.entry_id;
  IF d <> c OR d = 0 THEN RAISE EXCEPTION 'JOURNAL_UNBALANCED: entry % debit=% kredit=%', NEW.entry_id, d, c; END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER trg_journal_balanced AFTER INSERT ON journal_lines
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_journal_balanced();

-- Jurnal minimal 2 baris & tanggal sesuai periode terbuka
CREATE OR REPLACE FUNCTION check_journal_period() RETURNS trigger AS $$
DECLARE p accounting_periods%ROWTYPE;
BEGIN
  SELECT * INTO p FROM accounting_periods WHERE id = NEW.period_id;
  IF p.status <> 'OPEN' THEN RAISE EXCEPTION 'PERIOD_CLOSED: periode %/% sudah ditutup', p.month, p.year; END IF;
  IF p.year <> EXTRACT(YEAR FROM NEW.entry_date) OR p.month <> EXTRACT(MONTH FROM NEW.entry_date) THEN
    RAISE EXCEPTION 'PERIOD_MISMATCH: tanggal jurnal % di luar periode %/%', NEW.entry_date, p.month, p.year;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_journal_period BEFORE INSERT ON journal_entries FOR EACH ROW EXECUTE FUNCTION check_journal_period();

CREATE OR REPLACE FUNCTION check_journal_min_lines() RETURNS trigger AS $$
BEGIN
  IF (SELECT COUNT(*) FROM journal_lines WHERE entry_id = NEW.id) < 2 THEN
    RAISE EXCEPTION 'JOURNAL_INCOMPLETE: jurnal % harus memiliki minimal 2 baris', NEW.id;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER trg_journal_min_lines AFTER INSERT ON journal_entries
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_journal_min_lines();

-- 6.4 Inventori & produksi
-- Rekonsiliasi ledger: saldo lot HARUS = Σ stock_movements (dicek saat COMMIT)
CREATE OR REPLACE FUNCTION check_lot_ledger() RETURNS trigger AS $$
DECLARE v NUMERIC;
BEGIN
  SELECT COALESCE(SUM(qty_delta),0) INTO v FROM stock_movements WHERE lot_id = NEW.id;
  IF v <> NEW.qty_on_hand THEN
    RAISE EXCEPTION 'LEDGER_MISMATCH: lot % saldo % ≠ Σ mutasi %', NEW.id, NEW.qty_on_hand, v;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER trg_lot_ledger AFTER INSERT OR UPDATE OF qty_on_hand ON inventory_lots
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_lot_ledger();

-- Grade harus bagian dari skema kategori produk (harga, SO, lot)
CREATE OR REPLACE FUNCTION check_grade_matches_product() RETURNS trigger AS $$
BEGIN
  IF NEW.grade_id IS NOT NULL AND NEW.product_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM products p JOIN grade_definitions g ON g.category_id = p.category_id
       WHERE p.id = NEW.product_id AND g.id = NEW.grade_id) THEN
    RAISE EXCEPTION 'GRADE_MISMATCH: grade % bukan bagian skema kategori produk %', NEW.grade_id, NEW.product_id;
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['purchase_prices','sales_prices','sales_order_lines','inventory_lots'] LOOP
    EXECUTE format('CREATE TRIGGER trg_grade_match BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION check_grade_matches_product()', t);
  END LOOP; END $$;

-- Output sortasi: grade sesuai kategori produk batch input
CREATE OR REPLACE FUNCTION check_sorting_output_grade() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM sorting_inputs i JOIN harvest_receipts h ON h.id = i.harvest_receipt_id
      JOIN products p ON p.id = h.product_id JOIN grade_definitions g ON g.category_id = p.category_id
      WHERE i.id = NEW.input_id AND g.id = NEW.grade_id) THEN
    RAISE EXCEPTION 'GRADE_MISMATCH: grade % tidak sesuai kategori produk batch input', NEW.grade_id;
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_sout_grade BEFORE INSERT OR UPDATE ON sorting_outputs FOR EACH ROW EXECUTE FUNCTION check_sorting_output_grade();

-- Zero Value Rule: harga grade afkir wajib Rp0 (SDD 9.1)
CREATE OR REPLACE FUNCTION check_reject_price() RETURNS trigger AS $$
BEGIN
  IF NEW.price <> 0 AND (SELECT is_reject FROM grade_definitions WHERE id = NEW.grade_id) THEN
    RAISE EXCEPTION 'REJECT_PRICE: harga grade afkir harus Rp0';
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_reject_price_buy  BEFORE INSERT ON purchase_prices FOR EACH ROW EXECUTE FUNCTION check_reject_price();
CREATE TRIGGER trg_reject_price_sell BEFORE INSERT ON sales_prices    FOR EACH ROW EXECUTE FUNCTION check_reject_price();

-- Mass Balance: saat order di-POST, Σ output = input untuk SETIAP batch (toleransi 0 kg)
CREATE OR REPLACE FUNCTION check_mass_balance() RETURNS trigger AS $$
DECLARE bad RECORD;
BEGIN
  IF NEW.status = 'POSTED' AND OLD.status IS DISTINCT FROM 'POSTED' THEN
    SELECT i.id, i.qty_input, COALESCE(SUM(o.qty),0) AS out_qty INTO bad
    FROM sorting_inputs i LEFT JOIN sorting_outputs o ON o.input_id = i.id
    WHERE i.order_id = NEW.id GROUP BY i.id, i.qty_input
    HAVING i.qty_input <> COALESCE(SUM(o.qty),0) LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'MASS_BALANCE_VIOLATION: input % = % kg, output = % kg', bad.id, bad.qty_input, bad.out_qty;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM sorting_inputs WHERE order_id = NEW.id) THEN
      RAISE EXCEPTION 'MASS_BALANCE_VIOLATION: order sortasi tanpa input';
    END IF;
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_mass_balance BEFORE UPDATE OF status ON sorting_orders FOR EACH ROW EXECUTE FUNCTION check_mass_balance();

-- Alokasi FIFO harus menutup seluruh qty baris SO (dicek saat COMMIT)
CREATE OR REPLACE FUNCTION check_so_allocated() RETURNS trigger AS $$
DECLARE a NUMERIC;
BEGIN
  SELECT COALESCE(SUM(qty),0) INTO a FROM so_allocations WHERE so_line_id = NEW.id;
  IF a <> NEW.qty THEN RAISE EXCEPTION 'ALLOCATION_MISMATCH: baris SO % qty % teralokasi %', NEW.id, NEW.qty, a; END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER trg_so_allocated AFTER INSERT ON sales_order_lines
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_so_allocated();

-- Anggota nonaktif tidak boleh menyetor / menerima saprotan baru
CREATE OR REPLACE FUNCTION check_member_active() RETURNS trigger AS $$
BEGIN
  IF (SELECT status FROM members WHERE id = NEW.member_id) <> 'AKTIF' THEN
    RAISE EXCEPTION 'MEMBER_INACTIVE: anggota % nonaktif', NEW.member_id;
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_member_active_hr  BEFORE INSERT ON harvest_receipts FOR EACH ROW EXECUTE FUNCTION check_member_active();
CREATE TRIGGER trg_member_active_iss BEFORE INSERT ON saprotan_issues  FOR EACH ROW EXECUTE FUNCTION check_member_active();

