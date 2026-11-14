CREATE TABLE roles (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(60) NOT NULL,
  description TEXT
);

CREATE TABLE permissions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(50) NOT NULL UNIQUE,                 -- 'modul:aksi'; '*' = semua
  description TEXT
);

CREATE TABLE role_permissions (
  role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username           VARCHAR(50)  NOT NULL,
  password_hash      TEXT         NOT NULL,                -- Argon2id (SRS-NFR-002)
  full_name          VARCHAR(100) NOT NULL,
  role_id            BIGINT       NOT NULL REFERENCES roles(id),
  member_id          BIGINT,                               -- FK ditambahkan setelah tabel members
  is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
  failed_login_count INT          NOT NULL DEFAULT 0,
  locked_until       TIMESTAMPTZ,
  last_login_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT ck_users_username CHECK (username ~ '^[A-Za-z0-9._-]{3,50}$')
);
CREATE UNIQUE INDEX uq_users_username_ci ON users (lower(username));

CREATE TABLE system_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB        NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_by  BIGINT REFERENCES users(id)
);

CREATE TABLE document_sequences (
  prefix      VARCHAR(10) NOT NULL,
  period_key  VARCHAR(10) NOT NULL,                        -- 'YYYYMM' | 'YYYYMMDD' | '-'
  last_value  BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, period_key)
);

CREATE TABLE audit_logs (                                  -- SRS-NFR-003 (append-only, trigger §6.2)
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  VARCHAR(63) NOT NULL,
  record_id   VARCHAR(40),
  action      VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changes     JSONB,
  user_id     BIGINT,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('ROP','EXPIRY','PAYMENT_DUE','SYSTEM')),
  severity    VARCHAR(10) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','WARNING','CRITICAL')),
  message     TEXT        NOT NULL,
  payload     JSONB,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  read_by     BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

