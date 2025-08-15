import { MiddlewareHandler } from 'hono';
import type { Bindings, Variables, Session, User } from '../types';

/**
 * Middleware d'authentification simple
 * Vérifie le token de session dans les headers
 */
export const authMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Token manquant' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Vérifier le token dans la DB
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first<Session & User>();

    if (!session) {
      return c.json({ success: false, error: 'Token invalide ou expiré' }, 401);
    }

    // Ajouter l'utilisateur au contexte
    c.set('user', {
      id: session.user_id,
      email: session.email,
      restaurant_name: session.restaurant_name,
      logo_url: session.logo_url,
      plan_id: session.plan_id,
      brand_color: session.brand_color,
      voice_settings: session.voice_settings,
      created_at: session.created_at,
      updated_at: session.updated_at,
      is_active: session.is_active
    });

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ success: false, error: 'Erreur d\'authentification' }, 500);
  }
};

/**
 * Middleware d'authentification optionnel pour les routes publiques
 */
export const optionalAuthMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const session = await c.env.DB.prepare(`
        SELECT s.*, u.* FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `).bind(token).first<Session & User>();

      if (session) {
        c.set('user', {
          id: session.user_id,
          email: session.email,
          restaurant_name: session.restaurant_name,
          logo_url: session.logo_url,
          plan_id: session.plan_id,
          brand_color: session.brand_color,
          voice_settings: session.voice_settings,
          created_at: session.created_at,
          updated_at: session.updated_at,
          is_active: session.is_active
        });
      }
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Ne pas échouer, continuer sans utilisateur
    }
  }

  await next();
};