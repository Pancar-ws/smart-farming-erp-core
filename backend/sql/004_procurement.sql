CREATE TABLE purchase_orders (                             -- SRS-PRC-001/003
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_no         VARCHAR(20) NOT NULL UNIQUE,
  supplier_id   BIGINT      NOT NULL REFERENCES suppliers(id),
  order_date    DATE        NOT NULL,
  expected_date DATE,
  status        VARCHAR(12) NOT NULL DEFAULT 'DRAFT',
  is_auto       BOOLEAN     NOT NULL DEFAULT FALSE,          -- usulan otomatis ROP
  total         d_money     NOT NULL DEFAULT 0,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    BIGINT REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_po_status CHECK (status IN ('PROPOSED','DRAFT','ORDERED','PARTIAL','RECEIVED','CANCELLED')),
  CONSTRAINT ck_po_dates  CHECK (expected_date IS NULL OR expected_date >= order_date),
  CONSTRAINT ck_po_total  CHECK (total >= 0)
);

CREATE TABLE purchase_order_lines (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_id        BIGINT  NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  saprotan_id  BIGINT  NOT NULL REFERENCES saprotan_items(id),
  qty          d_qty   NOT NULL,
  unit_price   d_money NOT NULL,
  qty_received d_qty   NOT NULL DEFAULT 0,
  CONSTRAINT uq_pol_item   UNIQUE (po_id, saprotan_id),
  CONSTRAINT ck_pol_qty    CHECK (qty > 0),
  CONSTRAINT ck_pol_price  CHECK (unit_price >= 0),
  CONSTRAINT ck_pol_recv   CHECK (qty_received >= 0)
);

CREATE TABLE goods_receipts (                              -- SRS-PRC-002
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gr_no         VARCHAR(20) NOT NULL UNIQUE,
  po_id         BIGINT      NOT NULL REFERENCES purchase_orders(id),
  warehouse_id  BIGINT      NOT NULL REFERENCES warehouses(id),
  received_date DATE        NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT 'POSTED',
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    BIGINT REFERENCES users(id),
  CONSTRAINT ck_gr_status CHECK (status IN ('POSTED','REVERSED'))
);

CREATE TABLE goods_receipt_lines (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gr_id        BIGINT NOT NULL REFERENCES goods_receipts(id),
  po_line_id   BIGINT NOT NULL REFERENCES purchase_order_lines(id),
  qty_received d_qty  NOT NULL,
  qty_variance d_qty  NOT NULL,                              -- pesanan − akumulasi diterima (boleh negatif)
  CONSTRAINT ck_grl_qty CHECK (qty_received > 0)
);

CREATE TABLE harvest_receipts (                            -- SDD 4.3 Setoran_Panen; SRS-PRC-004/005
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  receipt_no        VARCHAR(20) NOT NULL UNIQUE,
  batch_code        VARCHAR(30) NOT NULL UNIQUE,             -- ★ kunci traceability end-to-end
  member_id         BIGINT      NOT NULL REFERENCES members(id),
  product_id        BIGINT      NOT NULL REFERENCES products(id),
  warehouse_id      BIGINT      NOT NULL REFERENCES warehouses(id),
  received_at       TIMESTAMPTZ NOT NULL,
  gross_kg          d_qty       NOT NULL,
  tare_kg           d_qty       NOT NULL DEFAULT 0,
  wet_tare_pct      d_pct       NOT NULL DEFAULT 0,          -- potongan tara basah (TBDURS01)
  net_kg            d_qty       NOT NULL,
  moisture_pct      d_pct,
  status            VARCHAR(20) NOT NULL DEFAULT 'MENUNGGU_SORTASI',
  client_request_id VARCHAR(64) UNIQUE,                      -- idempotensi draf offline (URS-SAF-001)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        BIGINT REFERENCES users(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_hr_batch  CHECK (batch_code ~ '^BATCH-[0-9]{8}-[0-9]{3,}$'),
  CONSTRAINT ck_hr_weight CHECK (gross_kg > 0 AND tare_kg >= 0 AND gross_kg > tare_kg AND net_kg > 0),
  CONSTRAINT ck_hr_net    CHECK (abs(net_kg - (gross_kg - tare_kg) * (1 - wet_tare_pct / 100)) <= 0.002),
  CONSTRAINT ck_hr_status CHECK (status IN ('MENUNGGU_SORTASI','SEDANG_DIPROSES','SELESAI','DIBATALKAN'))
);

