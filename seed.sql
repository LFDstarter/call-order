-- Données de test pour le SaaS Restaurant Orders
-- Plans d'abonnement

INSERT OR IGNORE INTO plans (id, name, price, features, voice_enabled, multi_counter, ads_enabled) VALUES 
  ('basic', 'BASIC', 0, '["Affichage numéro", "Historique 30 jours"]', 0, 0, 0),
  ('premium', 'PREMIUM', 2900, '["Affichage numéro", "Voix personnalisée", "Multi-guichets", "Historique illimité"]', 1, 1, 0),
  ('golden', 'GOLDEN', 4900, '["Affichage numéro", "Voix personnalisée", "Multi-guichets", "Vidéos publicitaires", "Support VIP", "Analytics avancés"]', 1, 1, 1);

-- Utilisateur demo pour test
INSERT OR IGNORE INTO users (id, email, password, restaurant_name, plan_id, brand_color) VALUES 
  ('demo-user-1', 'demo@restaurant-orders.com', 'demo123', 'Restaurant Le Gourmet', 'premium', '#10b981'),
  ('demo-user-2', 'test@pizzaroma.com', 'test123', 'Pizza Roma', 'basic', '#f59e0b');

-- Guichets pour les restaurants
INSERT OR IGNORE INTO counters (id, user_id, name, color, position) VALUES 
  ('counter-1', 'demo-user-1', 'Comptoir Principal', '#10b981', 1),
  ('counter-2', 'demo-user-1', 'Drive & Emporter', '#3b82f6', 2),
  ('counter-3', 'demo-user-2', 'Comptoir Pizza', '#f59e0b', 1);

-- Commandes d'exemple
INSERT OR IGNORE INTO commands (id, number, message, user_id, counter_id, status) VALUES 
  ('cmd-1', '42', 'Commande prête au comptoir principal', 'demo-user-1', 'counter-1', 'active'),
  ('cmd-2', '38', 'Drive - Votre pizza est prête', 'demo-user-1', 'counter-2', 'active'),
  ('cmd-3', '15', 'Pizza Margherita prête', 'demo-user-2', 'counter-3', 'active'),
  ('cmd-4', '41', 'Commande terminée', 'demo-user-1', 'counter-1', 'completed'),
  ('cmd-5', '37', 'Commande expirée', 'demo-user-1', 'counter-1', 'cancelled');

-- Log d'activité
INSERT OR IGNORE INTO activity_log (id, user_id, action, details) VALUES 
  ('log-1', 'demo-user-1', 'command_created', '{"command_number": "42", "counter": "Comptoir Principal"}'),
  ('log-2', 'demo-user-1', 'command_created', '{"command_number": "38", "counter": "Drive & Emporter"}'),
  ('log-3', 'demo-user-2', 'command_created', '{"command_number": "15", "counter": "Comptoir Pizza"}');