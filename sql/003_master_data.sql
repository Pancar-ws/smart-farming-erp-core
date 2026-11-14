CREATE TABLE members (                                     -- SDD 4.1 Anggota_Tani; SRS-MBR-001/002
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_code     VARCHAR(10)  NOT NULL UNIQUE,
  nik             CHAR(16)     NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  address         TEXT,
  area_ha         NUMERIC(7,2) NOT NULL,
  main_commodity  VARCHAR(30)  NOT NULL,
  phone           VARCHAR(15),
  status          VARCHAR(10)  NOT NULL DEFAULT 'AKTIF',
  joined_at       DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_by      BIGINT REFERENCES users(id),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT ck_members_code   CHECK (member_code ~ '^AGT-[0-9]{5}$'),
  CONSTRAINT ck_members_nik    CHECK (nik ~ '^[0-9]{16}$'),
  CONSTRAINT ck_members_name   CHECK (length(btrim(name)) > 0),
  CONSTRAINT ck_members_area   CHECK (area_ha > 0),
  CONSTRAINT ck_members_comm   CHECK (main_commodity IN ('Pangan','Hortikultura Sayur','Buah')),
  CONSTRAINT ck_members_phone  CHECK (phone IS NULL OR phone ~ '^(\+62|62|0)[0-9]{8,13}$'),
  CONSTRAINT ck_members_status CHECK (status IN ('AKTIF','NON_AKTIF'))
);

ALTER TABLE users ADD CONSTRAINT fk_users_member FOREIGN KEY (member_id) REFERENCES members(id);

CREATE TABLE product_categories (                          -- Master Kategori Produk
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                VARCHAR(50) NOT NULL UNIQUE,           -- Tanaman Pangan / Sayuran / Buah
  grading_criteria    JSONB       NOT NULL DEFAULT '{}',     -- mis. {"kriteria":["kadar air","kebersihan"]}
  shelf_life_days     INT         NOT NULL,
  expiry_warning_days INT         NOT NULL DEFAULT 2,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_cat_shelf  CHECK (shelf_life_days > 0),
  CONSTRAINT ck_cat_warn   CHECK (expiry_warning_days >= 0 AND expiry_warning_days <= shelf_life_days)
);

CREATE TABLE grade_definitions (                           -- URS-MFG-002: grade = data, bukan kolom
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT      NOT NULL REFERENCES product_categories(id),
  code        VARCHAR(20) NOT NULL,                          -- A, B, Premium, Medium, AFKIR
  name        VARCHAR(60) NOT NULL,
  is_reject   BOOLEAN     NOT NULL DEFAULT FALSE,            -- TRUE = afkir/susut (nilai Rp0)
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  criteria    JSONB       NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_grade_cat_code UNIQUE (category_id, code)
);

CREATE TABLE products (                                    -- Master Produk
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  category_id BIGINT       NOT NULL REFERENCES product_categories(id),
  uom         VARCHAR(10)  NOT NULL DEFAULT 'kg',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE purchase_prices (                             -- SRS-PRC-007 (append-only → riwayat harga)
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT      NOT NULL REFERENCES products(id),
  grade_id   BIGINT      NOT NULL REFERENCES grade_definitions(id),
  price      d_money     NOT NULL,
  valid_from DATE        NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by BIGINT REFERENCES users(id),
  CONSTRAINT ck_pp_price CHECK (price >= 0)
);

CREATE TABLE sales_prices (                                -- SRS-SLS-003 (harga bertingkat per segmen)
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT      NOT NULL REFERENCES products(id),
  grade_id   BIGINT      NOT NULL REFERENCES grade_definitions(id),
  segment    VARCHAR(20) NOT NULL,
  price      d_money     NOT NULL,
  valid_from DATE        NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by BIGINT REFERENCES users(id),
  CONSTRAINT ck_sp_price   CHECK (price >= 0),
  CONSTRAINT ck_sp_segment CHECK (segment IN ('KONSUMEN','RETAIL','PASAR_MODERN'))
);

CREATE TABLE saprotan_items (                              -- SDD 4.2 Saprotan
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL,
  uom         VARCHAR(20)  NOT NULL,                         -- 'kg','Pak','Sak 50kg','Pcs'
  purchase_price d_money   NOT NULL DEFAULT 0,
  member_price   d_money   NOT NULL DEFAULT 0,               -- harga penyaluran ke anggota
  min_stock   d_qty        NOT NULL DEFAULT 0,               -- ROP (default NPK/Organik 500 kg)
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT ck_sap_type  CHECK (type IN ('BENIH','PUPUK_ORGANIK','PUPUK_KIMIA','KEMASAN')),
  CONSTRAINT ck_sap_price CHECK (purchase_price >= 0 AND member_price >= purchase_price),
  CONSTRAINT ck_sap_min   CHECK (min_stock >= 0)
);

CREATE TABLE customers (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code              VARCHAR(20)  NOT NULL UNIQUE,
  name              VARCHAR(100) NOT NULL,
  segment           VARCHAR(20)  NOT NULL,
  address           TEXT,
  phone             VARCHAR(20),
  payment_term_days INT          NOT NULL DEFAULT 0,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT ck_cust_segment CHECK (segment IN ('KONSUMEN','RETAIL','PASAR_MODERN')),
  CONSTRAINT ck_cust_term    CHECK (payment_term_days >= 0)
);

CREATE TABLE warehouses (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  location   TEXT,
  type       VARCHAR(20)  NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT ck_wh_type CHECK (type IN ('SAPROTAN','PANEN_MENTAH','BARANG_JADI','LIMBAH'))
);

CREATE TABLE suppliers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20),
  address    TEXT,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE supplier_items (                              -- Item_Dipasok
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  supplier_id   BIGINT  NOT NULL REFERENCES suppliers(id),
  saprotan_id   BIGINT  NOT NULL REFERENCES saprotan_items(id),
  default_price d_money NOT NULL,
  lead_time_days INT    NOT NULL DEFAULT 3,
  CONSTRAINT uq_supplier_item UNIQUE (supplier_id, saprotan_id),
  CONSTRAINT ck_si_price CHECK (default_price >= 0)
);

