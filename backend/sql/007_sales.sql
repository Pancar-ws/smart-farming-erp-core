CREATE TABLE sales_orders (                                -- SDD 4.5 Sales_Order (header)
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  so_no       VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT      NOT NULL REFERENCES customers(id),
  segment     VARCHAR(20) NOT NULL,                          -- snapshot
  order_date  DATE        NOT NULL,
  status      VARCHAR(12) NOT NULL DEFAULT 'CONFIRMED',
  total       d_money     NOT NULL DEFAULT 0,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  BIGINT REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_sor_segment CHECK (segment IN ('KONSUMEN','RETAIL','PASAR_MODERN')),
  CONSTRAINT ck_sor_status  CHECK (status IN ('CONFIRMED','SHIPPED','CANCELLED')),
  CONSTRAINT ck_sor_total   CHECK (total >= 0)
);

CREATE TABLE sales_order_lines (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  so_id      BIGINT  NOT NULL REFERENCES sales_orders(id),
  product_id BIGINT  NOT NULL REFERENCES products(id),
  grade_id   BIGINT  NOT NULL REFERENCES grade_definitions(id),
  qty        d_qty   NOT NULL,
  unit_price d_money NOT NULL,                               -- terkunci dari sales_prices
  CONSTRAINT ck_sol_qty   CHECK (qty > 0),
  CONSTRAINT ck_sol_price CHECK (unit_price >= 0)
);

CREATE TABLE so_allocations (                              -- hasil FIFO; = qty_reserved di lot
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  so_line_id  BIGINT NOT NULL REFERENCES sales_order_lines(id),
  lot_id      BIGINT NOT NULL REFERENCES inventory_lots(id),
  qty         d_qty  NOT NULL,
  CONSTRAINT uq_alloc UNIQUE (so_line_id, lot_id),
  CONSTRAINT ck_alloc_qty CHECK (qty > 0)
);

CREATE TABLE delivery_orders (                             -- Surat Jalan; SRS-SLS-005
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  do_no        VARCHAR(20) NOT NULL UNIQUE,
  so_id        BIGINT      NOT NULL REFERENCES sales_orders(id),
  delivered_at TIMESTAMPTZ NOT NULL,
  vehicle_type VARCHAR(30),
  distance_km  NUMERIC(8,2),                                 -- dasar emisi karbon ESG (D-08)
  status       VARCHAR(10) NOT NULL DEFAULT 'CONFIRMED',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   BIGINT REFERENCES users(id),
  CONSTRAINT ck_do_status CHECK (status IN ('CONFIRMED','REVERSED')),
  CONSTRAINT ck_do_dist   CHECK (distance_km IS NULL OR distance_km >= 0)
);

CREATE TABLE delivery_lines (                              -- append-only; memuat BATCH (SRS-SLS-007)
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  do_id      BIGINT      NOT NULL REFERENCES delivery_orders(id),
  so_line_id BIGINT      NOT NULL REFERENCES sales_order_lines(id),
  lot_id     BIGINT      NOT NULL REFERENCES inventory_lots(id),
  batch_code VARCHAR(30) NOT NULL REFERENCES harvest_receipts(batch_code),
  grade_id   BIGINT      NOT NULL REFERENCES grade_definitions(id),
  qty        d_qty       NOT NULL,
  unit_price d_money     NOT NULL,
  unit_cost  d_money     NOT NULL,
  CONSTRAINT ck_dl_qty CHECK (qty > 0)
);

CREATE TABLE sales_invoices (                              -- SRS-SLS-006
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_no  VARCHAR(20) NOT NULL UNIQUE,
  do_id       BIGINT      NOT NULL UNIQUE REFERENCES delivery_orders(id),
  customer_id BIGINT      NOT NULL REFERENCES customers(id),
  issue_date  DATE        NOT NULL,
  due_date    DATE        NOT NULL,
  total       d_money     NOT NULL,
  status      VARCHAR(10) NOT NULL DEFAULT 'OPEN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  BIGINT REFERENCES users(id),
  CONSTRAINT ck_inv_status CHECK (status IN ('OPEN','PARTIAL','PAID','REVERSED')),
  CONSTRAINT ck_inv_dates  CHECK (due_date >= issue_date),
  CONSTRAINT ck_inv_total  CHECK (total >= 0)
);

CREATE TABLE sales_returns (                               -- SRS-SLS-009
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  return_no   VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT      NOT NULL REFERENCES customers(id),
  return_date DATE        NOT NULL,
  reason      TEXT,
  status      VARCHAR(10) NOT NULL DEFAULT 'POSTED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  BIGINT REFERENCES users(id),
  CONSTRAINT ck_ret_status CHECK (status IN ('POSTED','REVERSED'))
);

CREATE TABLE sales_return_lines (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  return_id        BIGINT      NOT NULL REFERENCES sales_returns(id),
  delivery_line_id BIGINT      NOT NULL REFERENCES delivery_lines(id),
  qty              d_qty       NOT NULL,
  condition        VARCHAR(10) NOT NULL,
  CONSTRAINT ck_rl_qty  CHECK (qty > 0),
  CONSTRAINT ck_rl_cond CHECK (condition IN ('LAYAK','RUSAK'))
);

