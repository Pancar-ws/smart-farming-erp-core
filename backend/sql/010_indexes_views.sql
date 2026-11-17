-- ============================================================================
-- 010_indexes_views.sql: Indeks Kinerja, View & Fungsi Pelaporan
-- ============================================================================

-- Master
CREATE INDEX idx_members_status      ON members (status);
CREATE INDEX idx_members_name_trgm   ON members USING gin (name gin_trgm_ops);
CREATE INDEX idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_category   ON products (category_id);
CREATE INDEX idx_pprice_lookup       ON purchase_prices (product_id, grade_id, valid_from DESC, id DESC);
CREATE INDEX idx_sprice_lookup       ON sales_prices (product_id, grade_id, segment, valid_from DESC, id DESC);

-- Procurement
CREATE INDEX idx_hr_member_date      ON harvest_receipts (member_id, received_at DESC);
CREATE INDEX idx_hr_queue            ON harvest_receipts (received_at) WHERE status IN ('MENUNGGU_SORTASI','SEDANG_DIPROSES');
CREATE INDEX idx_hr_product          ON harvest_receipts (product_id);
CREATE INDEX idx_po_supplier_status  ON purchase_orders (supplier_id, status);
CREATE INDEX idx_pol_saprotan        ON purchase_order_lines (saprotan_id);

-- Inventory
CREATE INDEX idx_lots_fifo           ON inventory_lots (product_id, grade_id, received_at, id)
                                        WHERE qty_on_hand > 0 AND stock_category IN ('HASIL_SORTASI','PRODUK_KEMASAN');
CREATE INDEX idx_lots_saprotan       ON inventory_lots (saprotan_id) WHERE saprotan_id IS NOT NULL;
CREATE INDEX idx_lots_batch          ON inventory_lots (batch_code) WHERE batch_code IS NOT NULL;
CREATE INDEX idx_lots_expiry         ON inventory_lots (expiry_date) WHERE qty_on_hand > 0 AND expiry_date IS NOT NULL;
CREATE INDEX idx_moves_lot           ON stock_movements (lot_id, created_at);
CREATE INDEX idx_moves_ref           ON stock_movements (ref_type, ref_id);
CREATE INDEX idx_iss_member          ON saprotan_issues (member_id, issue_date);
CREATE INDEX idx_isl_issue           ON saprotan_issue_lines (issue_id);

-- Manufacturing
CREATE INDEX idx_sin_order           ON sorting_inputs (order_id);
CREATE INDEX idx_sin_receipt         ON sorting_inputs (harvest_receipt_id);
CREATE INDEX idx_sout_input          ON sorting_outputs (input_id);
CREATE INDEX idx_qc_order            ON quality_checks (order_id);

-- Sales
CREATE INDEX idx_sor_customer_date   ON sales_orders (customer_id, order_date DESC);
CREATE INDEX idx_sor_status          ON sales_orders (status);
CREATE INDEX idx_sol_so              ON sales_order_lines (so_id);
CREATE INDEX idx_alloc_lot           ON so_allocations (lot_id);
CREATE INDEX idx_dl_batch            ON delivery_lines (batch_code);
CREATE INDEX idx_dl_do               ON delivery_lines (do_id);
CREATE INDEX idx_inv_customer_status ON sales_invoices (customer_id, status);
CREATE INDEX idx_inv_due             ON sales_invoices (due_date) WHERE status IN ('OPEN','PARTIAL');

-- Accounting
CREATE INDEX idx_je_date             ON journal_entries (entry_date);
CREATE INDEX idx_je_source           ON journal_entries (source_type, source_id);
CREATE INDEX idx_je_period           ON journal_entries (period_id);
CREATE INDEX idx_jl_account          ON journal_lines (account_id, entry_id);
CREATE INDEX idx_jl_entry            ON journal_lines (entry_id);
CREATE INDEX idx_payables_member     ON payables (member_id, status) WHERE member_id IS NOT NULL;
CREATE INDEX idx_payables_supplier   ON payables (supplier_id, status) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_payables_due        ON payables (due_date) WHERE status IN ('OPEN','PARTIAL');
CREATE INDEX idx_receivables_cust    ON receivables (customer_id, status) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_receivables_member  ON receivables (member_id, status) WHERE member_id IS NOT NULL;
CREATE INDEX idx_pay_alloc_payable   ON payment_allocations (payable_id) WHERE payable_id IS NOT NULL;
CREATE INDEX idx_pay_alloc_recv      ON payment_allocations (receivable_id) WHERE receivable_id IS NOT NULL;

-- Sistem
CREATE INDEX idx_audit_record        ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_user_time     ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_time          ON audit_logs USING brin (created_at);
CREATE INDEX idx_notif_unread        ON notifications (created_at DESC) WHERE is_read = FALSE;

-- ============================================================================
-- Views & Functions
-- ============================================================================

-- 8.1 Stok saprotan per item & gudang + penanda minimum (URS-RPT-001)
CREATE VIEW v_saprotan_stock AS
SELECT s.id AS saprotan_id, s.code, s.name, s.type, l.warehouse_id, w.name AS warehouse,
       COALESCE(l.qty_on_hand,0) AS qty_on_hand, s.min_stock,
       (COALESCE(t.total,0) <= s.min_stock) AS below_minimum
FROM saprotan_items s
LEFT JOIN inventory_lots l ON l.saprotan_id = s.id AND l.stock_category = 'SAPROTAN'
LEFT JOIN warehouses w ON w.id = l.warehouse_id
LEFT JOIN LATERAL (SELECT SUM(x.qty_on_hand) AS total FROM inventory_lots x WHERE x.saprotan_id = s.id) t ON TRUE;

-- 8.2 Stok barang jadi per komoditas, grade, batch (URS-RPT-002)
CREATE VIEW v_finished_stock AS
SELECT l.product_id, p.name AS product, l.grade_id, g.code AS grade, l.batch_code, l.warehouse_id,
       l.stock_category, l.qty_on_hand, l.qty_reserved, l.qty_on_hand - l.qty_reserved AS qty_available,
       l.unit_cost, l.received_at, l.expiry_date, (l.expiry_date - CURRENT_DATE) AS days_left
FROM inventory_lots l
JOIN products p ON p.id = l.product_id
JOIN grade_definitions g ON g.id = l.grade_id
WHERE l.stock_category IN ('HASIL_SORTASI','PRODUK_KEMASAN') AND l.qty_on_hand > 0;

-- 8.3 Margin per batch & grade, dikurangi retur (SRS-ACC-005)
CREATE VIEW v_batch_margin AS
WITH ret AS (
  SELECT rl.delivery_line_id, SUM(rl.qty) AS qty
  FROM sales_return_lines rl JOIN sales_returns r ON r.id = rl.return_id AND r.status = 'POSTED'
  GROUP BY rl.delivery_line_id),
base AS (
  SELECT dl.batch_code, dl.grade_id, g.code AS grade,
         SUM((dl.qty - COALESCE(ret.qty,0)) * dl.unit_price) AS penjualan,
         SUM((dl.qty - COALESCE(ret.qty,0)) * dl.unit_cost)  AS harga_beli
  FROM delivery_lines dl
  JOIN delivery_orders d ON d.id = dl.do_id AND d.status = 'CONFIRMED'
  JOIN grade_definitions g ON g.id = dl.grade_id
  LEFT JOIN ret ON ret.delivery_line_id = dl.id
  GROUP BY dl.batch_code, dl.grade_id, g.code)
SELECT batch_code, grade_id, grade, penjualan, harga_beli,
       penjualan - harga_beli AS margin_kotor,
       ROUND(100 * (penjualan - harga_beli) / NULLIF(penjualan,0), 2) AS margin_pct
FROM base;

-- 8.4 Ketertelusuran datar: panen → sortasi → jual (URS-RPT-005)
CREATE VIEW v_batch_trace AS
SELECT h.batch_code, h.receipt_no, h.received_at, m.member_code, m.name AS member_name, h.net_kg,
       so.order_no AS sorting_no, so.process_date,
       dl.qty AS qty_sold, g.code AS grade, d.do_no, i.invoice_no, c.name AS customer, c.segment
FROM harvest_receipts h
JOIN members m ON m.id = h.member_id
LEFT JOIN sorting_inputs si ON si.harvest_receipt_id = h.id
LEFT JOIN sorting_orders so ON so.id = si.order_id AND so.status = 'POSTED'
LEFT JOIN delivery_lines dl ON dl.batch_code = h.batch_code
LEFT JOIN grade_definitions g ON g.id = dl.grade_id
LEFT JOIN delivery_orders d ON d.id = dl.do_id AND d.status = 'CONFIRMED'
LEFT JOIN sales_invoices i ON i.do_id = d.id
LEFT JOIN sales_orders s ON s.id = d.so_id
LEFT JOIN customers c ON c.id = s.customer_id;

-- 8.5 Efisiensi sortasi per komoditas & bulan (Versi bebas duplikasi)
CREATE VIEW v_sorting_efficiency AS
WITH per_input AS (
  SELECT si.id, so.process_date, h.product_id, si.qty_input,
         COALESCE(SUM(CASE WHEN g.is_reject THEN o.qty END), 0) AS afkir
  FROM sorting_inputs si
  JOIN sorting_orders so ON so.id = si.order_id AND so.status = 'POSTED'
  JOIN harvest_receipts h ON h.id = si.harvest_receipt_id
  LEFT JOIN sorting_outputs o ON o.input_id = si.id
  LEFT JOIN grade_definitions g ON g.id = o.grade_id
  GROUP BY si.id, so.process_date, h.product_id, si.qty_input)
SELECT date_trunc('month', pi.process_date)::date AS bulan, p.id AS product_id, p.name AS product,
       SUM(pi.qty_input) AS total_input, SUM(pi.afkir) AS total_afkir,
       ROUND(100 * SUM(pi.afkir) / NULLIF(SUM(pi.qty_input),0), 2) AS susut_pct
FROM per_input pi JOIN products p ON p.id = pi.product_id
GROUP BY 1, p.id, p.name;

-- 8.6 Umur hutang (aging) — hutang anggota & supplier
CREATE VIEW v_payable_aging AS
SELECT p.id, p.party_type, COALESCE(m.name, s.name) AS party, p.source_no, p.amount, p.paid,
       p.amount - p.paid AS outstanding, p.due_date,
       GREATEST(CURRENT_DATE - p.due_date, 0) AS days_overdue,
       CASE WHEN CURRENT_DATE <= p.due_date THEN 'BELUM_JATUH_TEMPO'
            WHEN CURRENT_DATE - p.due_date <= 30 THEN '1-30'
            WHEN CURRENT_DATE - p.due_date <= 60 THEN '31-60'
            ELSE '>60' END AS bucket
FROM payables p LEFT JOIN members m ON m.id = p.member_id LEFT JOIN suppliers s ON s.id = p.supplier_id
WHERE p.status IN ('OPEN','PARTIAL');

-- 8.7 Rekap per anggota (URS-MBR-004)
CREATE VIEW v_member_summary AS
SELECT m.id AS member_id, m.member_code, m.name, m.status,
       COALESCE(h.total_kg,0)    AS total_setoran_kg,
       COALESCE(p.amount,0)      AS total_nilai_panen,
       COALESCE(p.paid,0)        AS total_dibayar,
       COALESCE(p.amount - p.paid,0) AS hutang_koperasi,
       COALESCE(r.amount - r.paid,0) AS piutang_saprotan
FROM members m
LEFT JOIN (SELECT member_id, SUM(net_kg) total_kg FROM harvest_receipts WHERE status <> 'DIBATALKAN' GROUP BY member_id) h ON h.member_id = m.id
LEFT JOIN (SELECT member_id, SUM(amount) amount, SUM(paid) paid FROM payables WHERE party_type='MEMBER' AND status <> 'VOID' GROUP BY member_id) p ON p.member_id = m.id
LEFT JOIN (SELECT member_id, SUM(amount) amount, SUM(paid) paid FROM receivables WHERE party_type='MEMBER' AND status <> 'VOID' GROUP BY member_id) r ON r.member_id = m.id;

-- 8.8 ESG-Environmental: rasio pupuk organik vs kimia per bulan (URS-RPT-007)
CREATE VIEW v_esg_fertilizer AS
SELECT date_trunc('month', i.issue_date)::date AS bulan,
       SUM(l.qty) FILTER (WHERE l.fertilizer_type = 'PUPUK_ORGANIK') AS organik_kg,
       SUM(l.qty) FILTER (WHERE l.fertilizer_type = 'PUPUK_KIMIA')   AS kimia_kg,
       ROUND(100 * SUM(l.qty) FILTER (WHERE l.fertilizer_type = 'PUPUK_ORGANIK')
             / NULLIF(SUM(l.qty) FILTER (WHERE l.fertilizer_type IN ('PUPUK_ORGANIK','PUPUK_KIMIA')),0), 2) AS organik_pct
FROM saprotan_issue_lines l JOIN saprotan_issues i ON i.id = l.issue_id AND i.status = 'POSTED'
GROUP BY 1;

-- 8.9 ESG-Social: ketepatan pembayaran ke anggota (URS-RPT-008)
CREATE VIEW v_esg_payment_timeliness AS
SELECT date_trunc('month', pm.paid_date)::date AS bulan,
       COUNT(*) AS jumlah_pembayaran,
       COUNT(*) FILTER (WHERE pm.paid_date <= pb.due_date) AS tepat_waktu,
       ROUND(100.0 * COUNT(*) FILTER (WHERE pm.paid_date <= pb.due_date) / NULLIF(COUNT(*),0), 2) AS tepat_waktu_pct
FROM payment_allocations pa
JOIN payments pm ON pm.id = pa.payment_id AND pm.direction = 'PAY' AND pm.party_type = 'MEMBER'
JOIN payables pb ON pb.id = pa.payable_id
GROUP BY 1;

-- 8.10 Neraca saldo per rentang tanggal (dasar Laba Rugi & Neraca)
CREATE OR REPLACE FUNCTION fn_trial_balance(p_start DATE, p_end DATE)
RETURNS TABLE (code VARCHAR, name VARCHAR, type VARCHAR, debit NUMERIC, credit NUMERIC, balance NUMERIC) AS $$
  SELECT a.code, a.name, a.type, COALESCE(SUM(l.debit),0), COALESCE(SUM(l.credit),0),
         CASE WHEN a.type IN ('ASSET','EXPENSE') THEN COALESCE(SUM(l.debit - l.credit),0)
              ELSE COALESCE(SUM(l.credit - l.debit),0) END
  FROM accounts a
  LEFT JOIN journal_lines l ON l.account_id = a.id
  LEFT JOIN journal_entries e ON e.id = l.entry_id AND e.entry_date BETWEEN p_start AND p_end
  WHERE l.id IS NULL OR e.id IS NOT NULL
  GROUP BY a.code, a.name, a.type ORDER BY a.code;
$$ LANGUAGE sql STABLE;

-- 8.11 Laba rugi sederhana per rentang tanggal
CREATE OR REPLACE FUNCTION fn_income_statement(p_start DATE, p_end DATE)
RETURNS TABLE (total_revenue NUMERIC, total_cogs NUMERIC, gross_profit NUMERIC, opex NUMERIC, net_income NUMERIC) AS $$
  WITH tb AS (SELECT * FROM fn_trial_balance(p_start, p_end))
  SELECT rev, cogs, rev - cogs, opex, rev - cogs - opex FROM (
    SELECT COALESCE(SUM(balance) FILTER (WHERE type = 'REVENUE'),0) AS rev,
           COALESCE(SUM(balance) FILTER (WHERE type = 'EXPENSE' AND code LIKE '5-%'),0) AS cogs,
           COALESCE(SUM(balance) FILTER (WHERE type = 'EXPENSE' AND code LIKE '6-%'),0) AS opex
    FROM tb) x;
$$ LANGUAGE sql STABLE;

-- 8.12 Dashboard ringkas (SDD 7.2)
CREATE VIEW v_dashboard_today AS
SELECT
  (SELECT COALESCE(SUM(net_kg),0) FROM harvest_receipts WHERE received_at::date = CURRENT_DATE AND status <> 'DIBATALKAN') AS panen_masuk_kg,
  (SELECT COUNT(*) FROM harvest_receipts WHERE status IN ('MENUNGGU_SORTASI','SEDANG_DIPROSES')) AS antrean_sortasi,
  (SELECT COUNT(DISTINCT saprotan_id) FROM v_saprotan_stock WHERE below_minimum) AS item_di_bawah_minimum,
  (SELECT COALESCE(SUM(total),0) FROM sales_invoices WHERE issue_date = CURRENT_DATE AND status <> 'REVERSED') AS omset_hari_ini;

