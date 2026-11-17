CREATE TABLE accounts (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(10)  NOT NULL,
  is_postable BOOLEAN      NOT NULL DEFAULT TRUE,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT ck_acc_type CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  CONSTRAINT ck_acc_code CHECK (code ~ '^[1-6]-[0-9]{4}$')
);

CREATE TABLE accounting_periods (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  year      SMALLINT    NOT NULL,
  month     SMALLINT    NOT NULL,
  status    VARCHAR(8)  NOT NULL DEFAULT 'OPEN',
  closed_at TIMESTAMPTZ,
  closed_by BIGINT REFERENCES users(id),
  CONSTRAINT uq_period UNIQUE (year, month),
  CONSTRAINT ck_per_month  CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT ck_per_status CHECK (status IN ('OPEN','CLOSED'))
);

CREATE TABLE journal_entries (                             -- immutable (trigger §6.2)
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_no       VARCHAR(20) NOT NULL UNIQUE,
  entry_date     DATE        NOT NULL,
  period_id      BIGINT      NOT NULL REFERENCES accounting_periods(id),
  description    TEXT        NOT NULL,
  source_type    VARCHAR(30) NOT NULL,
  source_id      BIGINT,
  source_no      VARCHAR(30),
  reversal_of_id BIGINT REFERENCES journal_entries(id),
  reversed_by_id BIGINT REFERENCES journal_entries(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     BIGINT REFERENCES users(id),
  CONSTRAINT ck_je_self CHECK (reversal_of_id IS NULL OR reversal_of_id <> id)
);

CREATE TABLE journal_lines (                               -- immutable, berpasangan
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_id   BIGINT  NOT NULL REFERENCES journal_entries(id),
  account_id BIGINT  NOT NULL REFERENCES accounts(id),
  debit      d_money NOT NULL DEFAULT 0,
  credit     d_money NOT NULL DEFAULT 0,
  memo       TEXT,
  party_type VARCHAR(10),                                    -- sub-ledger ringan: MEMBER/SUPPLIER/CUSTOMER
  party_id   BIGINT,
  CONSTRAINT ck_jl_amount CHECK (debit >= 0 AND credit >= 0 AND (debit = 0 OR credit = 0) AND (debit + credit) > 0),
  CONSTRAINT ck_jl_party  CHECK (party_type IS NULL OR party_type IN ('MEMBER','SUPPLIER','CUSTOMER'))
);

CREATE TABLE payables (                                    -- Hutang: anggota (panen) & supplier (saprotan)
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  party_type  VARCHAR(10) NOT NULL,
  member_id   BIGINT REFERENCES members(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  source_type VARCHAR(30) NOT NULL,
  source_id   BIGINT      NOT NULL,
  source_no   VARCHAR(30),
  amount      d_money     NOT NULL,
  paid        d_money     NOT NULL DEFAULT 0,
  due_date    DATE        NOT NULL,
  status      VARCHAR(8)  NOT NULL DEFAULT 'OPEN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_pay_party  CHECK ((party_type = 'MEMBER'   AND member_id   IS NOT NULL AND supplier_id IS NULL)
                               OR (party_type = 'SUPPLIER' AND supplier_id IS NOT NULL AND member_id   IS NULL)),
  CONSTRAINT ck_pay_amount CHECK (amount > 0 AND paid >= 0 AND paid <= amount),
  CONSTRAINT ck_pay_status CHECK (status IN ('OPEN','PARTIAL','PAID','VOID')),
  CONSTRAINT ck_pay_state  CHECK ((status = 'PAID' AND paid = amount) OR (status <> 'PAID'))
);

CREATE TABLE receivables (                                 -- Piutang: pelanggan (faktur) & anggota (saprotan)
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  party_type  VARCHAR(10) NOT NULL,
  customer_id BIGINT REFERENCES customers(id),
  member_id   BIGINT REFERENCES members(id),
  source_type VARCHAR(30) NOT NULL,
  source_id   BIGINT      NOT NULL,
  source_no   VARCHAR(30),
  amount      d_money     NOT NULL,
  paid        d_money     NOT NULL DEFAULT 0,
  due_date    DATE,
  status      VARCHAR(8)  NOT NULL DEFAULT 'OPEN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_rec_party  CHECK ((party_type = 'CUSTOMER' AND customer_id IS NOT NULL AND member_id   IS NULL)
                               OR (party_type = 'MEMBER'   AND member_id   IS NOT NULL AND customer_id IS NULL)),
  CONSTRAINT ck_rec_amount CHECK (amount > 0 AND paid >= 0 AND paid <= amount),
  CONSTRAINT ck_rec_status CHECK (status IN ('OPEN','PARTIAL','PAID','VOID'))
);

CREATE TABLE payments (                                    -- kas keluar (PAY) & kas masuk (RECEIVE)
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_no   VARCHAR(20) NOT NULL UNIQUE,
  direction    VARCHAR(7)  NOT NULL,
  party_type   VARCHAR(10) NOT NULL,
  member_id    BIGINT REFERENCES members(id),
  supplier_id  BIGINT REFERENCES suppliers(id),
  customer_id  BIGINT REFERENCES customers(id),
  paid_date    DATE        NOT NULL,
  method       VARCHAR(10) NOT NULL DEFAULT 'TUNAI',
  amount       d_money     NOT NULL,                         -- kas bersih (setelah offset)
  external_ref VARCHAR(60),                                  -- no. bukti transfer (TBDURS02: tanpa integrasi bank)
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   BIGINT REFERENCES users(id),
  CONSTRAINT ck_pm_dir    CHECK (direction IN ('PAY','RECEIVE')),
  CONSTRAINT ck_pm_party  CHECK (
       (party_type = 'MEMBER'   AND member_id   IS NOT NULL AND supplier_id IS NULL AND customer_id IS NULL)
    OR (party_type = 'SUPPLIER' AND supplier_id IS NOT NULL AND member_id   IS NULL AND customer_id IS NULL)
    OR (party_type = 'CUSTOMER' AND customer_id IS NOT NULL AND member_id   IS NULL AND supplier_id IS NULL)),
  CONSTRAINT ck_pm_method CHECK (method IN ('TUNAI','TRANSFER','LAINNYA')),
  CONSTRAINT ck_pm_amount CHECK (amount >= 0)
);

CREATE TABLE payment_allocations (                         -- append-only
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id    BIGINT  NOT NULL REFERENCES payments(id),
  payable_id    BIGINT  REFERENCES payables(id),
  receivable_id BIGINT  REFERENCES receivables(id),
  amount        d_money NOT NULL,
  is_offset     BOOLEAN NOT NULL DEFAULT FALSE,              -- TRUE = potong piutang saprotan anggota
  CONSTRAINT ck_pa_one    CHECK ((payable_id IS NULL) <> (receivable_id IS NULL)),
  CONSTRAINT ck_pa_amount CHECK (amount > 0)
);

CREATE TABLE operating_expenses (                          -- SRS-ACC-006
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  expense_date     DATE        NOT NULL,
  category         VARCHAR(40) NOT NULL,
  account_id       BIGINT      NOT NULL REFERENCES accounts(id),
  amount           d_money     NOT NULL,
  description      TEXT,
  journal_entry_id BIGINT REFERENCES journal_entries(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       BIGINT REFERENCES users(id),
  CONSTRAINT ck_exp_amount CHECK (amount > 0)
);

CREATE TABLE shu_runs (                                    -- SRS-ACC-008
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  net_income   d_money     NOT NULL,
  config       JSONB       NOT NULL,                         -- snapshot rumus pembagian
  status       VARCHAR(8)  NOT NULL DEFAULT 'DRAFT',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   BIGINT REFERENCES users(id),
  CONSTRAINT ck_shu_period CHECK (period_end >= period_start),
  CONSTRAINT ck_shu_status CHECK (status IN ('DRAFT','FINAL'))
);

CREATE TABLE shu_allocations (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id        BIGINT  NOT NULL REFERENCES shu_runs(id) ON DELETE CASCADE,
  member_id     BIGINT  NOT NULL REFERENCES members(id),
  participation d_money NOT NULL,
  amount        d_money NOT NULL,
  CONSTRAINT uq_shu_member UNIQUE (run_id, member_id),
  CONSTRAINT ck_shua CHECK (participation >= 0 AND amount >= 0)
);

CREATE TABLE esg_logs (                                    -- SDD 4.6 ESG_Log
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  esg_no             VARCHAR(20) NOT NULL UNIQUE,
  batch_code         VARCHAR(30) NOT NULL UNIQUE REFERENCES harvest_receipts(batch_code),
  food_loss_ratio    d_pct,                                  -- afkir / input × 100 (SDG 12.3)
  organic_ratio      d_pct,                                  -- rasio pupuk organik anggota (snapshot, opsional)
  carbon_emission_kg NUMERIC(10,2),                          -- jarak × ton × faktor emisi
  farmer_margin_ratio d_ratio,                               -- total beli ÷ total jual × 100 (SDG 8.5)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

