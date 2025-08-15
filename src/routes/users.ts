import { Hono } from 'hono';
import type { Bindings, Variables, UpdateUserInput, User, Counter } from '../types';
import { authMiddleware } from '../middleware/auth';
import { 
  generateId, 
  sanitizeInput, 
  generateRandomColor,
  createApiResponse 
} from '../utils';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Toutes les routes nécessitent une authentification
userRoutes.use('*', authMiddleware);

/**
 * Récupérer le profil utilisateur complet
 * GET /api/users/profile
 */
userRoutes.get('/profile', async (c) => {
  try {
    const user = c.get('user');

    // Récupérer les informations complètes avec le plan
    const profile = await c.env.DB.prepare(`
      SELECT 
        u.*,
        p.name as plan_name,
        p.price as plan_price,
        p.features as plan_features,
        p.voice_enabled,
        p.multi_counter,
        p.ads_enabled
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ?
    `).bind(user.id).first();

    // Récupérer les guichets
    const counters = await c.env.DB.prepare(`
      SELECT * FROM counters 
      WHERE user_id = ? 
      ORDER BY position ASC
    `).bind(user.id).all();

    if (!profile) {
      return c.json(createApiResponse(false, null, null, 'Profil non trouvé'), 404);
    }

    const { password, ...profileWithoutPassword } = profile;

    return c.json(createApiResponse(true, {
      ...profileWithoutPassword,
      counters: counters.results,
      plan_features: profile.plan_features ? JSON.parse(profile.plan_features) : []
    }));

  } catch (error) {
    console.error('Get profile error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la récupération du profil'), 500);
  }
});

/**
 * Mettre à jour le profil utilisateur
 * PUT /api/users/profile
 */
userRoutes.put('/profile', async (c) => {
  try {
    const user = c.get('user');
    const body: UpdateUserInput = await c.req.json();
    const { restaurant_name, logo_url, brand_color, voice_settings } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (restaurant_name) {
      updates.push('restaurant_name = ?');
      values.push(sanitizeInput(restaurant_name));
    }

    if (logo_url) {
      updates.push('logo_url = ?');
      values.push(sanitizeInput(logo_url));
    }

    if (brand_color && /^#[0-9A-F]{6}$/i.test(brand_color)) {
      updates.push('brand_color = ?');
      values.push(brand_color);
    }

    if (voice_settings) {
      updates.push('voice_settings = ?');
      values.push(voice_settings);
    }

    if (updates.length === 0) {
      return c.json(createApiResponse(false, null, null, 'Aucune modification spécifiée'), 400);
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(user.id);

    await c.env.DB.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return c.json(createApiResponse(true, null, 'Profil mis à jour avec succès'));

  } catch (error) {
    console.error('Update profile error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la mise à jour'), 500);
  }
});

/**
 * Récupérer les guichets de l'utilisateur
 * GET /api/users/counters
 */
userRoutes.get('/counters', async (c) => {
  try {
    const user = c.get('user');

    const counters = await c.env.DB.prepare(`
      SELECT * FROM counters 
      WHERE user_id = ? 
      ORDER BY position ASC
    `).bind(user.id).all();

    return c.json(createApiResponse(true, {
      counters: counters.results,
      count: counters.results.length
    }));

  } catch (error) {
    console.error('Get counters error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la récupération'), 500);
  }
});

/**
 * Créer un nouveau guichet
 * POST /api/users/counters
 */
userRoutes.post('/counters', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { name, color } = body;

    if (!name) {
      return c.json(createApiResponse(false, null, null, 'Nom du guichet requis'), 400);
    }

    // Vérifier les limites selon le plan
    const userPlan = await c.env.DB.prepare(`
      SELECT p.* FROM plans p
      JOIN users u ON p.id = u.plan_id
      WHERE u.id = ?
    `).bind(user.id).first();

    if (!userPlan?.multi_counter) {
      const counterCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM counters WHERE user_id = ?
      `).bind(user.id).first();

      if (counterCount && counterCount.count >= 1) {
        return c.json(createApiResponse(false, null, null, 'Plan actuel limité à 1 guichet'), 400);
      }
    }

    // Calculer la position
    const maxPosition = await c.env.DB.prepare(`
      SELECT COALESCE(MAX(position), 0) as max_pos FROM counters WHERE user_id = ?
    `).bind(user.id).first();

    const counterId = generateId();
    const counterColor = color || generateRandomColor();

    await c.env.DB.prepare(`
      INSERT INTO counters (id, user_id, name, color, position)
      VALUES (?, ?, ?, ?, ?)
    `).bind(counterId, user.id, sanitizeInput(name), counterColor, (maxPosition?.max_pos || 0) + 1).run();

    const newCounter = await c.env.DB.prepare(`
      SELECT * FROM counters WHERE id = ?
    `).bind(counterId).first();

    return c.json(createApiResponse(true, newCounter, 'Guichet créé avec succès'));

  } catch (error) {
    console.error('Create counter error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la création'), 500);
  }
});

/**
 * Mettre à jour un guichet
 * PUT /api/users/counters/:id
 */
userRoutes.put('/counters/:id', async (c) => {
  try {
    const user = c.get('user');
    const counterId = c.req.param('id');
    const body = await c.req.json();
    const { name, color, is_active, position } = body;

    // Vérifier que le guichet appartient à l'utilisateur
    const counter = await c.env.DB.prepare(`
      SELECT * FROM counters WHERE id = ? AND user_id = ?
    `).bind(counterId, user.id).first<Counter>();

    if (!counter) {
      return c.json(createApiResponse(false, null, null, 'Guichet non trouvé'), 404);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(sanitizeInput(name));
    }

    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      updates.push('color = ?');
      values.push(color);
    }

    if (typeof is_active === 'boolean') {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (typeof position === 'number') {
      updates.push('position = ?');
      values.push(position);
    }

    if (updates.length === 0) {
      return c.json(createApiResponse(false, null, null, 'Aucune modification spécifiée'), 400);
    }

    values.push(counterId);

    await c.env.DB.prepare(`
      UPDATE counters 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return c.json(createApiResponse(true, null, 'Guichet mis à jour'));

  } catch (error) {
    console.error('Update counter error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la mise à jour'), 500);
  }
});

/**
 * Supprimer un guichet
 * DELETE /api/users/counters/:id
 */
userRoutes.delete('/counters/:id', async (c) => {
  try {
    const user = c.get('user');
    const counterId = c.req.param('id');

    // Vérifier que le guichet appartient à l'utilisateur
    const counter = await c.env.DB.prepare(`
      SELECT * FROM counters WHERE id = ? AND user_id = ?
    `).bind(counterId, user.id).first();

    if (!counter) {
      return c.json(createApiResponse(false, null, null, 'Guichet non trouvé'), 404);
    }

    // Vérifier qu'il reste au moins un guichet
    const counterCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM counters WHERE user_id = ?
    `).bind(user.id).first();

    if (counterCount && counterCount.count <= 1) {
      return c.json(createApiResponse(false, null, null, 'Impossible de supprimer le dernier guichet'), 400);
    }

    // Supprimer le guichet
    await c.env.DB.prepare('DELETE FROM counters WHERE id = ?').bind(counterId).run();

    // Mettre à null les commandes qui utilisaient ce guichet
    await c.env.DB.prepare(`
      UPDATE commands SET counter_id = NULL WHERE counter_id = ?
    `).bind(counterId).run();

    return c.json(createApiResponse(true, null, 'Guichet supprimé'));

  } catch (error) {
    console.error('Delete counter error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la suppression'), 500);
  }
});

export { userRoutes };