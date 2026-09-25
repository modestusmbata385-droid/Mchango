-- MCHANGO — PostgreSQL schema
-- Mirrors the data model already used by the localStorage frontend
-- (frontend/js/storage.js) so the switch-over later is a straight swap.

CREATE TABLE IF NOT EXISTS mchango (
  id          SERIAL PRIMARY KEY,
  jina        TEXT NOT NULL DEFAULT 'Mchango wa Harusi',
  tarehe      DATE NOT NULL DEFAULT CURRENT_DATE,
  lengo       NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gharama (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mchango_id  INTEGER NOT NULL REFERENCES mchango(id) ON DELETE CASCADE,
  jina        TEXT NOT NULL,
  kiasi       NUMERIC(14,2) NOT NULL DEFAULT 0,
  tarehe      DATE NOT NULL DEFAULT CURRENT_DATE,
  maelezo     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS washiriki (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mchango_id            INTEGER NOT NULL REFERENCES mchango(id) ON DELETE CASCADE,
  jina                  TEXT NOT NULL,
  simu                  TEXT DEFAULT '',
  kiasi_kinachotarajiwa NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS malipo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mchango_id    INTEGER NOT NULL REFERENCES mchango(id) ON DELETE CASCADE,
  mshiriki_id   UUID NOT NULL REFERENCES washiriki(id) ON DELETE CASCADE,
  kiasi         NUMERIC(14,2) NOT NULL DEFAULT 0,
  tarehe        DATE NOT NULL DEFAULT CURRENT_DATE,
  njia          TEXT DEFAULT 'Cash',
  maelezo       TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'approved', -- 'approved' (admin/confirmed) or 'pending' (submitted by mtoaji, hajaidhinishwa)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE malipo
ADD COLUMN IF NOT EXISTS order_reference TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_malipo_order_reference
ON malipo(order_reference);
-- Ensures the column exists even on a database created before this feature was added
ALTER TABLE malipo ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

CREATE TABLE IF NOT EXISTS settings (
  mchango_id      INTEGER PRIMARY KEY REFERENCES mchango(id) ON DELETE CASCADE,
  sarafu          TEXT NOT NULL DEFAULT 'TSh',
  mchango_wasii   TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_gharama_mchango ON gharama(mchango_id);
CREATE INDEX IF NOT EXISTS idx_washiriki_mchango ON washiriki(mchango_id);
CREATE INDEX IF NOT EXISTS idx_malipo_mchango ON malipo(mchango_id);
CREATE INDEX IF NOT EXISTS idx_malipo_mshiriki ON malipo(mshiriki_id);
CREATE INDEX IF NOT EXISTS idx_malipo_status ON malipo(status);

-- pgcrypto is needed for gen_random_uuid() on some Postgres builds
CREATE EXTENSION IF NOT EXISTS pgcrypto;
