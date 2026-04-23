-- ============================================================
--  EventSphere — Seed Data
--  Run: sqlite3 event_booking.db < seed_data.sql
--  Or paste into any SQLite client
-- ============================================================

-- ── Admin user (password: admin123, bcrypt hashed) ─────────
-- Note: The app auto-creates the admin on startup via ensure_admin()
-- This seed is for manual DB inspection / testing purposes.

-- ── Sample Events ──────────────────────────────────────────
INSERT INTO events (name, description, location, total_seats, available_seats, date, created_at)
VALUES
  (
    'FastAPI Workshop',
    'Hands-on workshop covering FastAPI fundamentals, async endpoints, and OpenAPI standards.',
    'Tech Hub, Chennai',
    30,
    30,
    datetime('now', '+15 days'),
    datetime('now')
  ),
  (
    'Machine Learning Workshop',
    'Introduction to ML algorithms, scikit-learn, and model deployment.',
    'Innovation Centre, Bangalore',
    50,
    50,
    datetime('now', '+30 days'),
    datetime('now')
  ),
  (
    'UI/UX Design Workshop',
    'Learn design thinking, Figma prototyping, and user research techniques.',
    'Design Studio, Mumbai',
    25,
    25,
    datetime('now', '+45 days'),
    datetime('now')
  ),
  (
    'React & Three.js Bootcamp',
    'Build interactive 3D web applications using React and Three.js.',
    'Code Academy, Hyderabad',
    40,
    40,
    datetime('now', '+60 days'),
    datetime('now')
  ),
  (
    'DevOps & CI/CD Summit',
    'Deep dive into Docker, GitHub Actions, and automated deployment pipelines.',
    'Cloud Campus, Pune',
    60,
    60,
    datetime('now', '+75 days'),
    datetime('now')
  );

-- ── Auto-generate seats for each event ─────────────────────
-- Event 1 — 30 seats (A1–C10)
INSERT INTO seats (event_id, seat_number, status)
SELECT 1, 
  CHAR(64 + ((seq-1)/10 + 1)) || ((seq-1)%10 + 1),
  'AVAILABLE'
FROM (
  WITH RECURSIVE cnt(seq) AS (SELECT 1 UNION ALL SELECT seq+1 FROM cnt WHERE seq < 30)
  SELECT seq FROM cnt
);

-- Event 2 — 50 seats (A1–E10)
INSERT INTO seats (event_id, seat_number, status)
SELECT 2,
  CHAR(64 + ((seq-1)/10 + 1)) || ((seq-1)%10 + 1),
  'AVAILABLE'
FROM (
  WITH RECURSIVE cnt(seq) AS (SELECT 1 UNION ALL SELECT seq+1 FROM cnt WHERE seq < 50)
  SELECT seq FROM cnt
);

-- Event 3 — 25 seats (A1–C5)
INSERT INTO seats (event_id, seat_number, status)
SELECT 3,
  CHAR(64 + ((seq-1)/10 + 1)) || ((seq-1)%10 + 1),
  'AVAILABLE'
FROM (
  WITH RECURSIVE cnt(seq) AS (SELECT 1 UNION ALL SELECT seq+1 FROM cnt WHERE seq < 25)
  SELECT seq FROM cnt
);

-- Event 4 — 40 seats (A1–D10)
INSERT INTO seats (event_id, seat_number, status)
SELECT 4,
  CHAR(64 + ((seq-1)/10 + 1)) || ((seq-1)%10 + 1),
  'AVAILABLE'
FROM (
  WITH RECURSIVE cnt(seq) AS (SELECT 1 UNION ALL SELECT seq+1 FROM cnt WHERE seq < 40)
  SELECT seq FROM cnt
);

-- Event 5 — 60 seats (A1–F10)
INSERT INTO seats (event_id, seat_number, status)
SELECT 5,
  CHAR(64 + ((seq-1)/10 + 1)) || ((seq-1)%10 + 1),
  'AVAILABLE'
FROM (
  WITH RECURSIVE cnt(seq) AS (SELECT 1 UNION ALL SELECT seq+1 FROM cnt WHERE seq < 60)
  SELECT seq FROM cnt
);

-- ── Verify ──────────────────────────────────────────────────
SELECT 'Events inserted: ' || COUNT(*) FROM events;
SELECT 'Seats inserted:  ' || COUNT(*) FROM seats;
