-- AI Dungeon Master — Schema v1

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  game_system TEXT NOT NULL,
  tone INTEGER DEFAULT 65,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_state (
  session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  state JSON NOT NULL,
  turn INTEGER DEFAULT 0,
  mode TEXT DEFAULT 'exploration' CHECK(mode IN ('exploration','combat','dialogue')),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  player_action TEXT NOT NULL,
  ai_response JSON NOT NULL,
  state_delta JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  data JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_turns_session ON turns(session_id);
CREATE INDEX IF NOT EXISTS idx_characters_session ON characters(session_id);
