CREATE TABLE inventory_lots (                              -- posisi stok seluruh 4 kategori (+limbah)
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stock_category VARCHAR(20) NOT NULL,
  warehouse_id   BIGINT      NOT NULL REFERENCES warehouses(id),
  saprotan_id    BIGINT      REFERENCES saprotan_items(id),
  product_id     BIGINT      REFERENCES products(id),
  grade_id       BIGINT      REFERENCES grade_definitions(id),
  batch_code     VARCHAR(30) REFERENCES harvest_receipts(batch_code),
  qty_on_hand    d_qty       NOT NULL DEFAULT 0,
  qty_reserved   d_qty       NOT NULL DEFAULT 0,
  unit_cost      d_money     NOT NULL DEFAULT 0,
  received_at    TIMESTAMPTZ NOT NULL,                       -- dasar urutan FIFO
  expiry_date    DATE,
  pack_unit      VARCHAR(10),
  pack_size_kg   d_qty,
  pack_count     INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     BIGINT REFERENCES users(id),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_lot_category CHECK (stock_category IN ('SAPROTAN','PANEN_MENTAH','HASIL_SORTASI','PRODUK_KEMASAN','LIMBAH')),
  CONSTRAINT ck_lot_nonneg   CHECK (qty_on_hand >= 0),                                    -- SRS-INV-010
  CONSTRAINT ck_lot_reserved CHECK (qty_reserved >= 0 AND qty_reserved <= qty_on_hand),
  CONSTRAINT ck_lot_cost     CHECK (unit_cost >= 0),
  CONSTRAINT ck_lot_xor      CHECK ((saprotan_id IS NULL) <> (product_id IS NULL)),
  CONSTRAINT ck_lot_shape    CHECK (
       (stock_category = 'SAPROTAN'      AND saprotan_id IS NOT NULL AND batch_code IS NULL     AND grade_id IS NULL)
    OR (stock_category = 'PANEN_MENTAH'  AND product_id  IS NOT NULL AND batch_code IS NOT NULL AND grade_id IS NULL)
    OR (stock_category IN ('HASIL_SORTASI','PRODUK_KEMASAN','LIMBAH')
                                         AND product_id  IS NOT NULL AND batch_code IS NOT NULL AND grade_id IS NOT NULL)),
  CONSTRAINT ck_lot_pack     CHECK (stock_category = 'PRODUK_KEMASAN' OR (pack_unit IS NULL AND pack_size_kg IS NULL AND pack_count IS NULL)),
  CONSTRAINT ck_lot_packunit CHECK (pack_unit IS NULL OR pack_unit IN ('KG','KARUNG','IKAT','PETI'))
);

-- identitas lot (mencegah duplikasi akibat race condition)
CREATE UNIQUE INDEX uq_lot_identity ON inventory_lots (
  stock_category, warehouse_id,
  COALESCE(saprotan_id, 0), COALESCE(product_id, 0), COALESCE(grade_id, 0),
  COALESCE(batch_code, ''), COALESCE(pack_unit, ''), COALESCE(pack_size_kg, 0));

CREATE TABLE stock_movements (                             -- LEDGER stok, append-only
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lot_id         BIGINT      NOT NULL REFERENCES inventory_lots(id),
  movement_type  VARCHAR(20) NOT NULL,
  qty_delta      d_qty       NOT NULL,
  balance_after  d_qty       NOT NULL,
  ref_type       VARCHAR(30),
  ref_id         BIGINT,
  ref_no         VARCHAR(30),
  reversal_of_id BIGINT REFERENCES stock_movements(id),
  note           TEXT,
  created_by     BIGINT REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_mv_type  CHECK (movement_type IN ('RECEIPT','ISSUE','TRANSFER_OUT','TRANSFER_IN','ADJUST_IN','ADJUST_OUT',
                                                  'SORT_CONSUME','SORT_OUTPUT','PACK_CONSUME','PACK_OUTPUT','DELIVERY','RETURN_IN','REVERSAL')),
  CONSTRAINT ck_mv_delta CHECK (qty_delta <> 0),
  CONSTRAINT ck_mv_bal   CHECK (balance_after >= 0)
);

CREATE TABLE saprotan_issues (                             -- penyaluran ke anggota; SRS-INV-003
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_no     VARCHAR(20) NOT NULL UNIQUE,
  member_id    BIGINT      NOT NULL REFERENCES members(id),
  warehouse_id BIGINT      NOT NULL REFERENCES warehouses(id),
  issue_date   DATE        NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'POSTED',
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   BIGINT REFERENCES users(id),
  CONSTRAINT ck_iss_status CHECK (status IN ('POSTED','REVERSED'))
);

CREATE TABLE saprotan_issue_lines (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id        BIGINT      NOT NULL REFERENCES saprotan_issues(id),
  saprotan_id     BIGINT      NOT NULL REFERENCES saprotan_items(id),
  qty             d_qty       NOT NULL,
  unit_cost       d_money     NOT NULL,
  unit_price      d_money     NOT NULL,
  fertilizer_type VARCHAR(20) NOT NULL,                      -- snapshot jenis → indikator ESG (SRS-INV-004)
  CONSTRAINT ck_isl_qty  CHECK (qty > 0),
  CONSTRAINT ck_isl_type CHECK (fertilizer_type IN ('BENIH','PUPUK_ORGANIK','PUPUK_KIMIA','KEMASAN'))
);

CREATE TABLE saprotan_usages (                             -- pemakaian oleh anggota (URS-INV-004)
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id   BIGINT NOT NULL REFERENCES members(id),
  saprotan_id BIGINT NOT NULL REFERENCES saprotan_items(id),
  qty         d_qty  NOT NULL,
  used_at     DATE   NOT NULL,
  area_ha     NUMERIC(7,2),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  BIGINT REFERENCES users(id),
  CONSTRAINT ck_use_qty CHECK (qty > 0)
);

CREATE TABLE stock_transfers (                             -- mutasi antar gudang; SRS-INV-009
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transfer_no       VARCHAR(20) NOT NULL UNIQUE,
  from_warehouse_id BIGINT      NOT NULL REFERENCES warehouses(id),
  to_warehouse_id   BIGINT      NOT NULL REFERENCES warehouses(id),
  transfer_date     DATE        NOT NULL,
  status            VARCHAR(10) NOT NULL DEFAULT 'POSTED',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        BIGINT REFERENCES users(id),
  CONSTRAINT ck_tr_diff   CHECK (from_warehouse_id <> to_warehouse_id),
  CONSTRAINT ck_tr_status CHECK (status IN ('POSTED','REVERSED'))
);
CREATE TABLE stock_transfer_lines (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transfer_id BIGINT NOT NULL REFERENCES stock_transfers(id),
  lot_id      BIGINT NOT NULL REFERENCES inventory_lots(id),
  qty         d_qty  NOT NULL,
  CONSTRAINT ck_trl_qty CHECK (qty > 0)
);

CREATE TABLE stock_adjustments (                           -- stock opname
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  adj_no     VARCHAR(20) NOT NULL UNIQUE,
  adj_date   DATE        NOT NULL,
  reason     TEXT        NOT NULL,
  status     VARCHAR(10) NOT NULL DEFAULT 'POSTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by BIGINT REFERENCES users(id),
  CONSTRAINT ck_adj_status CHECK (status IN ('POSTED','REVERSED'))
);
CREATE TABLE stock_adjustment_lines (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  adj_id      BIGINT NOT NULL REFERENCES stock_adjustments(id),
  lot_id      BIGINT NOT NULL REFERENCES inventory_lots(id),
  qty_system  d_qty  NOT NULL,
  qty_counted d_qty  NOT NULL,
  qty_delta   d_qty  GENERATED ALWAYS AS (qty_counted - qty_system) STORED,
  CONSTRAINT ck_adjl_counted CHECK (qty_counted >= 0)
);

