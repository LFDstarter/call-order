-- Restaurant Orders SaaS - Schéma initial de base de données
-- Créé pour gérer les restaurants, utilisateurs, commandes et systèmes d'abonnements

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL,
  features TEXT NOT NULL, -- JSON string des fonctionnalités
  voice_enabled INTEGER DEFAULT 0,
  multi_counter INTEGER DEFAULT 0,
  ads_enabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs/restaurants
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  logo_url TEXT,
  plan_id TEXT DEFAULT 'basic',
  brand_color TEXT DEFAULT '#3b82f6',
  voice_settings TEXT, -- JSON pour config voix
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Table des guichets/comptoirs
CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  is_active INTEGER DEFAULT 1,
  position INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  message TEXT,
  user_id TEXT NOT NULL,
  counter_id TEXT,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  is_announced INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  announced_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (counter_id) REFERENCES counters(id)
);

-- Table pour l'historique des actions
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT, -- JSON des détails
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des sessions (simple auth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_commands_user_id ON commands(user_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_commands_created_at ON commands(created_at);
CREATE INDEX IF NOT EXISTS idx_counters_user_id ON counters(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);