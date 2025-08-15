import { Hono } from 'hono';
import type { Bindings, Variables, LoginInput, RegisterInput, User } from '../types';
import { 
  generateId, 
  generateSessionToken, 
  validateEmail, 
  hashPassword, 
  verifyPassword, 
  getSessionExpiration,
  createApiResponse 
} from '../utils';

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Connexion utilisateur
 * POST /api/auth/login
 */
authRoutes.post('/login', async (c) => {
  try {
    const body: LoginInput = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(createApiResponse(false, null, null, 'Email et mot de passe requis'), 400);
    }

    if (!validateEmail(email)) {
      return c.json(createApiResponse(false, null, null, 'Format email invalide'), 400);
    }

    // Chercher l'utilisateur
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first<User>();

    if (!user) {
      return c.json(createApiResponse(false, null, null, 'Email ou mot de passe incorrect'), 401);
    }

    // Vérifier le mot de passe
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return c.json(createApiResponse(false, null, null, 'Email ou mot de passe incorrect'), 401);
    }

    // Créer une session
    const sessionId = generateId();
    const token = generateSessionToken();
    const expiresAt = getSessionExpiration();

    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, user.id, token, expiresAt.toISOString()).run();

    // Retourner les données utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    return c.json(createApiResponse(true, {
      user: userWithoutPassword,
      token,
      expires_at: expiresAt.toISOString()
    }, 'Connexion réussie'));

  } catch (error) {
    console.error('Login error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur de connexion'), 500);
  }
});

/**
 * Inscription utilisateur (pour démo - en prod, il faudrait validation email)
 * POST /api/auth/register
 */
authRoutes.post('/register', async (c) => {
  try {
    const body: RegisterInput = await c.req.json();
    const { email, password, restaurant_name } = body;

    if (!email || !password || !restaurant_name) {
      return c.json(createApiResponse(false, null, null, 'Tous les champs sont requis'), 400);
    }

    if (!validateEmail(email)) {
      return c.json(createApiResponse(false, null, null, 'Format email invalide'), 400);
    }

    if (password.length < 6) {
      return c.json(createApiResponse(false, null, null, 'Le mot de passe doit contenir au moins 6 caractères'), 400);
    }

    // Vérifier si l'email existe déjà
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json(createApiResponse(false, null, null, 'Cet email est déjà utilisé'), 400);
    }

    // Créer l'utilisateur
    const userId = generateId();
    const hashedPassword = await hashPassword(password);

    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password, restaurant_name, plan_id, brand_color)
      VALUES (?, ?, ?, ?, 'basic', '#3b82f6')
    `).bind(userId, email, hashedPassword, restaurant_name).run();

    // Créer un guichet par défaut
    const counterId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO counters (id, user_id, name, color, position)
      VALUES (?, ?, 'Comptoir Principal', '#3b82f6', 1)
    `).bind(counterId, userId).run();

    // Créer une session
    const sessionId = generateId();
    const token = generateSessionToken();
    const expiresAt = getSessionExpiration();

    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, userId, token, expiresAt.toISOString()).run();

    return c.json(createApiResponse(true, {
      user: {
        id: userId,
        email,
        restaurant_name,
        plan_id: 'basic',
        brand_color: '#3b82f6'
      },
      token,
      expires_at: expiresAt.toISOString()
    }, 'Inscription réussie'));

  } catch (error) {
    console.error('Register error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur d\'inscription'), 500);
  }
});

/**
 * Déconnexion utilisateur
 * POST /api/auth/logout
 */
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Supprimer la session
      await c.env.DB.prepare(
        'DELETE FROM sessions WHERE token = ?'
      ).bind(token).run();
    }

    return c.json(createApiResponse(true, null, 'Déconnexion réussie'));

  } catch (error) {
    console.error('Logout error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur de déconnexion'), 500);
  }
});

export { authRoutes };