import { Hono } from 'hono';
import type { Bindings, Variables, DisplayData } from '../types';
import { createApiResponse, parseFeatures } from '../utils';

const displayRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Récupérer les données d'affichage pour un utilisateur (écran TV)
 * GET /api/display/:userId
 */
displayRoutes.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    if (!userId) {
      return c.json(createApiResponse(false, null, null, 'ID utilisateur requis'), 400);
    }

    // Récupérer les infos du restaurant
    const user = await c.env.DB.prepare(`
      SELECT 
        u.restaurant_name,
        u.brand_color,
        u.logo_url,
        u.is_active,
        p.name as plan_name,
        p.features,
        p.ads_enabled
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ? AND u.is_active = 1
    `).bind(userId).first();

    if (!user) {
      return c.json(createApiResponse(false, null, null, 'Restaurant non trouvé'), 404);
    }

    // Récupérer les commandes actives
    const commands = await c.env.DB.prepare(`
      SELECT 
        c.*,
        ct.name as counter_name,
        ct.color as counter_color
      FROM commands c
      LEFT JOIN counters ct ON c.counter_id = ct.id
      WHERE c.user_id = ? AND c.status = 'active'
      ORDER BY c.priority DESC, c.created_at ASC
    `).bind(userId).all();

    // Récupérer les guichets actifs
    const counters = await c.env.DB.prepare(`
      SELECT * FROM counters 
      WHERE user_id = ? AND is_active = 1
      ORDER BY position ASC
    `).bind(userId).all();

    const displayData: DisplayData = {
      restaurant_name: user.restaurant_name,
      brand_color: user.brand_color,
      logo_url: user.logo_url,
      current_commands: commands.results,
      counters: counters.results
    };

    return c.json(createApiResponse(true, displayData));

  } catch (error) {
    console.error('Get display data error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la récupération'), 500);
  }
});

/**
 * API de ping pour vérifier la connectivité de l'écran
 * GET /api/display/:userId/ping
 */
displayRoutes.get('/:userId/ping', async (c) => {
  try {
    const userId = c.req.param('userId');

    // Vérifier que l'utilisateur existe et est actif
    const user = await c.env.DB.prepare(`
      SELECT id, is_active FROM users WHERE id = ? AND is_active = 1
    `).bind(userId).first();

    if (!user) {
      return c.json(createApiResponse(false, null, null, 'Restaurant non trouvé'), 404);
    }

    return c.json(createApiResponse(true, {
      timestamp: new Date().toISOString(),
      status: 'online'
    }));

  } catch (error) {
    console.error('Display ping error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur de ping'), 500);
  }
});

/**
 * Récupérer les statistiques d'affichage
 * GET /api/display/:userId/stats
 */
displayRoutes.get('/:userId/stats', async (c) => {
  try {
    const userId = c.req.param('userId');

    // Vérifier que l'utilisateur existe
    const user = await c.env.DB.prepare(`
      SELECT id FROM users WHERE id = ? AND is_active = 1
    `).bind(userId).first();

    if (!user) {
      return c.json(createApiResponse(false, null, null, 'Restaurant non trouvé'), 404);
    }

    // Statistiques des commandes
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_commands,
        COUNT(CASE WHEN status = 'completed' AND date(updated_at) = date('now') THEN 1 END) as completed_today,
        COUNT(CASE WHEN status = 'cancelled' AND date(updated_at) = date('now') THEN 1 END) as cancelled_today,
        COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as created_today
      FROM commands
      WHERE user_id = ?
    `).bind(userId).first();

    return c.json(createApiResponse(true, {
      active_commands: stats?.active_commands || 0,
      completed_today: stats?.completed_today || 0,
      cancelled_today: stats?.cancelled_today || 0,
      created_today: stats?.created_today || 0,
      last_updated: new Date().toISOString()
    }));

  } catch (error) {
    console.error('Display stats error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la récupération des stats'), 500);
  }
});

/**
 * Marquer une commande comme annoncée (pour tracking)
 * POST /api/display/:userId/announce/:commandId
 */
displayRoutes.post('/:userId/announce/:commandId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const commandId = c.req.param('commandId');

    // Vérifier que la commande appartient à l'utilisateur
    const command = await c.env.DB.prepare(`
      SELECT * FROM commands 
      WHERE id = ? AND user_id = ? AND status = 'active'
    `).bind(commandId, userId).first();

    if (!command) {
      return c.json(createApiResponse(false, null, null, 'Commande non trouvée'), 404);
    }

    // Marquer comme annoncée
    await c.env.DB.prepare(`
      UPDATE commands 
      SET is_announced = 1, announced_at = datetime('now')
      WHERE id = ?
    `).bind(commandId).run();

    return c.json(createApiResponse(true, null, 'Commande marquée comme annoncée'));

  } catch (error) {
    console.error('Announce command error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de l\'annonce'), 500);
  }
});

/**
 * API pour les vidéos publicitaires (plan GOLDEN)
 * GET /api/display/:userId/ads
 */
displayRoutes.get('/:userId/ads', async (c) => {
  try {
    const userId = c.req.param('userId');

    // Vérifier le plan et les permissions
    const user = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.is_active,
        p.ads_enabled
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ? AND u.is_active = 1
    `).bind(userId).first();

    if (!user) {
      return c.json(createApiResponse(false, null, null, 'Restaurant non trouvé'), 404);
    }

    if (!user.ads_enabled) {
      return c.json(createApiResponse(false, null, null, 'Publicités non disponibles pour ce plan'), 403);
    }

    // Pour l'instant, retourner des données mockées
    // En production, cela viendrait d'une table ads ou d'un service externe
    const ads = [
      {
        id: 'ad-1',
        type: 'image',
        url: 'https://via.placeholder.com/800x400/3b82f6/white?text=Publicité+Restaurant',
        duration: 5000,
        title: 'Promotion spéciale'
      },
      {
        id: 'ad-2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 10000,
        title: 'Vidéo promotionnelle'
      }
    ];

    return c.json(createApiResponse(true, {
      ads,
      rotation_interval: 30000, // 30 secondes entre les pubs
      display_between_commands: true
    }));

  } catch (error) {
    console.error('Get ads error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la récupération des publicités'), 500);
  }
});

export { displayRoutes };