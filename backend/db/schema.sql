CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_lower TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'boy1'
    CHECK (avatar IN ('boy1', 'boy2', 'girl1', 'girl2')),
  total_batches INTEGER NOT NULL DEFAULT 20,
  max_batch_reached INTEGER NOT NULL DEFAULT 0,
  batch_passed BOOLEAN[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
