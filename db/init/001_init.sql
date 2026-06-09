CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.database_status (
  id integer PRIMARY KEY DEFAULT 1,
  initialized_at timestamptz NOT NULL DEFAULT now(),
  note text NOT NULL DEFAULT 'ICTA dashboard database initialized'
);

INSERT INTO app.database_status (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
