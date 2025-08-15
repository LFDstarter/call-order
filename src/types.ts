// Types TypeScript pour le SaaS Restaurant Orders

export type Bindings = {
  DB: D1Database;
};

export type Variables = {
  user?: User;
};

// Modèles de données
export interface User {
  id: string;
  email: string;
  restaurant_name: string;
  logo_url?: string;
  plan_id: string;
  brand_color: string;
  voice_settings?: string;
  created_at: string;
  updated_at: string;
  is_active: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string;
  voice_enabled: number;
  multi_counter: number;
  ads_enabled: number;
  created_at: string;
}

export interface Counter {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_active: number;
  position: number;
  created_at: string;
}

export interface Command {
  id: string;
  number: string;
  message?: string;
  user_id: string;
  counter_id?: string;
  status: 'active' | 'completed' | 'cancelled';
  is_announced: number;
  priority: number;
  created_at: string;
  updated_at: string;
  announced_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  active_commands: number;
  total_today: number;
  plan_name: string;
  features: string[];
}

export interface DisplayData {
  restaurant_name: string;
  brand_color: string;
  logo_url?: string;
  current_commands: Command[];
  counters: Counter[];
  ads_enabled?: boolean;
}

// Types d'entrée pour les API
export interface CreateCommandInput {
  number: string;
  message?: string;
  counter_id?: string;
  priority?: number;
}

export interface UpdateUserInput {
  restaurant_name?: string;
  logo_url?: string;
  brand_color?: string;
  voice_settings?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  restaurant_name: string;
}