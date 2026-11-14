CREATE TABLE sorting_orders (                              -- SDD 4.4 Batch_Sortasi (induk)
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_no    VARCHAR(20) NOT NULL UNIQUE,
  process_date DATE       NOT NULL,
  status      VARCHAR(10) NOT NULL DEFAULT 'DRAFT',
  posted_at   TIMESTAMPTZ,
  posted_by   BIGINT REFERENCES users(id),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  BIGINT REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_so_status CHECK (status IN ('DRAFT','POSTED','REVERSED')),
  CONSTRAINT ck_so_posted CHECK ((status = 'DRAFT') OR posted_at IS NOT NULL)
);

CREATE TABLE sorting_inputs (                              -- 1 order : N batch input (URS-MFG-003)
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id           BIGINT  NOT NULL REFERENCES sorting_orders(id),
  harvest_receipt_id BIGINT  NOT NULL REFERENCES harvest_receipts(id),
  qty_input          d_qty   NOT NULL,
  shrink_pct         d_pct,                                   -- diisi saat POST (SRS-MFG-005)
  CONSTRAINT uq_sin_order_receipt UNIQUE (order_id, harvest_receipt_id),
  CONSTRAINT ck_sin_qty CHECK (qty_input > 0)
);

CREATE TABLE sorting_outputs (                             -- output per grade, per batch input
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  input_id  BIGINT NOT NULL REFERENCES sorting_inputs(id),
  grade_id  BIGINT NOT NULL REFERENCES grade_definitions(id),
  qty       d_qty  NOT NULL,
  CONSTRAINT uq_sout_input_grade UNIQUE (input_id, grade_id),
  CONSTRAINT ck_sout_qty CHECK (qty >= 0)
);

CREATE TABLE quality_checks (                              -- SRS-MFG-008 (append-only)
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id          BIGINT      NOT NULL REFERENCES sorting_orders(id),
  inspector_user_id BIGINT      NOT NULL REFERENCES users(id),
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  passed            BOOLEAN     NOT NULL,
  notes             TEXT
);

CREATE TABLE packaging_records (                           -- SRS-MFG-007
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_no     VARCHAR(20) NOT NULL UNIQUE,
  source_lot_id BIGINT      NOT NULL REFERENCES inventory_lots(id),
  output_lot_id BIGINT      NOT NULL REFERENCES inventory_lots(id),
  pack_unit     VARCHAR(10) NOT NULL,
  pack_size_kg  d_qty       NOT NULL,
  pack_count    INT         NOT NULL,
  qty_kg        d_qty       NOT NULL,
  packaged_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    BIGINT REFERENCES users(id),
  CONSTRAINT ck_pk_unit  CHECK (pack_unit IN ('KG','KARUNG','IKAT','PETI')),
  CONSTRAINT ck_pk_qty   CHECK (pack_size_kg > 0 AND pack_count > 0 AND qty_kg > 0),
  CONSTRAINT ck_pk_total CHECK (abs(qty_kg - pack_size_kg * pack_count) <= 0.002)
);

CREATE TABLE packaging_materials (                         -- pemakaian bahan kemasan (saprotan jenis KEMASAN)
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_id    BIGINT NOT NULL REFERENCES packaging_records(id),
  saprotan_id  BIGINT NOT NULL REFERENCES saprotan_items(id),
  qty          d_qty  NOT NULL,
  CONSTRAINT ck_pm_qty CHECK (qty > 0)
);

