import { Hono } from 'hono';
import type { Bindings, Variables, CreateCommandInput, Command } from '../types';
import { authMiddleware } from '../middleware/auth';
import { 
  generateId, 
  validateCommandNumber, 
  sanitizeInput, 
  createApiResponse 
} from '../utils';

const commandRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Toutes les routes nécessitent une authentification
commandRoutes.use('*', authMiddleware);

/**
 * Récupérer les commandes de l'utilisateur connecté
 * GET /api/commands
 */
commandRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const status = c.req.query('status') || 'active';
    const limit = parseInt(c.req.query('limit') || '50');

    const commands = await c.env.DB.prepare(`
      SELECT 
        c.*,
        ct.name as counter_name,
        ct.color as counter_color
      FROM commands c
      LEFT JOIN counters ct ON c.counter_id = ct.id
      WHERE c.user_id = ? AND c.status = ?
      ORDER BY c.created_at DESC
      LIMIT ?
    `).bind(user.id, status, limit).all();

    return c.json(createApiResponse(true, {
      commands: commands.results,
      count: commands.results.length
    }));

  } catch (error) {
    console.error('Get commands error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la récupération'), 500);
  }
});

/**
 * Créer une nouvelle commande
 * POST /api/commands
 */
commandRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body: CreateCommandInput = await c.req.json();
    const { number, message, counter_id, priority = 0 } = body;

    if (!number) {
      return c.json(createApiResponse(false, null, null, 'Numéro de commande requis'), 400);
    }

    if (!validateCommandNumber(number)) {
      return c.json(createApiResponse(false, null, null, 'Numéro invalide (1-4 caractères, lettres et chiffres)'), 400);
    }

    // Vérifier que le numéro n'existe pas déjà (pour les commandes actives)
    const existingCommand = await c.env.DB.prepare(`
      SELECT id FROM commands 
      WHERE user_id = ? AND number = ? AND status = 'active'
    `).bind(user.id, number).first();

    if (existingCommand) {
      return c.json(createApiResponse(false, null, null, 'Ce numéro est déjà actif'), 400);
    }

    // Vérifier que le guichet appartient à l'utilisateur si spécifié
    if (counter_id) {
      const counter = await c.env.DB.prepare(`
        SELECT id FROM counters WHERE id = ? AND user_id = ?
      `).bind(counter_id, user.id).first();

      if (!counter) {
        return c.json(createApiResponse(false, null, null, 'Guichet invalide'), 400);
      }
    }

    // Créer la commande
    const commandId = generateId();
    const sanitizedMessage = message ? sanitizeInput(message) : null;

    await c.env.DB.prepare(`
      INSERT INTO commands (id, number, message, user_id, counter_id, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).bind(commandId, number, sanitizedMessage, user.id, counter_id || null, priority).run();

    // Log de l'activité
    await c.env.DB.prepare(`
      INSERT INTO activity_log (id, user_id, action, details)
      VALUES (?, ?, 'command_created', ?)
    `).bind(
      generateId(), 
      user.id, 
      'command_created',
      JSON.stringify({ command_number: number, counter_id })
    ).run();

    // Récupérer la commande créée avec les infos du guichet
    const newCommand = await c.env.DB.prepare(`
      SELECT 
        c.*,
        ct.name as counter_name,
        ct.color as counter_color
      FROM commands c
      LEFT JOIN counters ct ON c.counter_id = ct.id
      WHERE c.id = ?
    `).bind(commandId).first();

    return c.json(createApiResponse(true, newCommand, 'Commande créée avec succès'));

  } catch (error) {
    console.error('Create command error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la création'), 500);
  }
});

/**
 * Mettre à jour une commande
 * PUT /api/commands/:id
 */
commandRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const commandId = c.req.param('id');
    const body = await c.req.json();
    const { status, message, is_announced } = body;

    // Vérifier que la commande appartient à l'utilisateur
    const command = await c.env.DB.prepare(`
      SELECT * FROM commands WHERE id = ? AND user_id = ?
    `).bind(commandId, user.id).first<Command>();

    if (!command) {
      return c.json(createApiResponse(false, null, null, 'Commande non trouvée'), 404);
    }

    // Construire la requête de mise à jour
    const updates: string[] = [];
    const values: any[] = [];

    if (status && ['active', 'completed', 'cancelled'].includes(status)) {
      updates.push('status = ?');
      values.push(status);
      
      if (status === 'completed' || status === 'cancelled') {
        updates.push('updated_at = datetime(\'now\')');
      }
    }

    if (message !== undefined) {
      updates.push('message = ?');
      values.push(message ? sanitizeInput(message) : null);
    }

    if (is_announced !== undefined) {
      updates.push('is_announced = ?');
      values.push(is_announced ? 1 : 0);
      
      if (is_announced) {
        updates.push('announced_at = datetime(\'now\')');
      }
    }

    if (updates.length === 0) {
      return c.json(createApiResponse(false, null, null, 'Aucune modification spécifiée'), 400);
    }

    // Exécuter la mise à jour
    values.push(commandId);
    await c.env.DB.prepare(`
      UPDATE commands 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    // Log de l'activité
    await c.env.DB.prepare(`
      INSERT INTO activity_log (id, user_id, action, details)
      VALUES (?, ?, 'command_updated', ?)
    `).bind(
      generateId(),
      user.id,
      'command_updated',
      JSON.stringify({ command_id: commandId, updates: body })
    ).run();

    return c.json(createApiResponse(true, null, 'Commande mise à jour'));

  } catch (error) {
    console.error('Update command error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la mise à jour'), 500);
  }
});

/**
 * Supprimer une commande
 * DELETE /api/commands/:id
 */
commandRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const commandId = c.req.param('id');

    // Vérifier que la commande appartient à l'utilisateur
    const command = await c.env.DB.prepare(`
      SELECT * FROM commands WHERE id = ? AND user_id = ?
    `).bind(commandId, user.id).first();

    if (!command) {
      return c.json(createApiResponse(false, null, null, 'Commande non trouvée'), 404);
    }

    // Supprimer la commande
    await c.env.DB.prepare('DELETE FROM commands WHERE id = ?').bind(commandId).run();

    // Log de l'activité
    await c.env.DB.prepare(`
      INSERT INTO activity_log (id, user_id, action, details)
      VALUES (?, ?, 'command_deleted', ?)
    `).bind(
      generateId(),
      user.id,
      'command_deleted',
      JSON.stringify({ command_id: commandId, number: command.number })
    ).run();

    return c.json(createApiResponse(true, null, 'Commande supprimée'));

  } catch (error) {
    console.error('Delete command error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la suppression'), 500);
  }
});

/**
 * Statistiques des commandes
 * GET /api/commands/stats
 */
commandRoutes.get('/stats', async (c) => {
  try {
    const user = c.get('user');

    // Commandes actives
    const activeCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM commands 
      WHERE user_id = ? AND status = 'active'
    `).bind(user.id).first();

    // Total aujourd'hui
    const todayCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM commands 
      WHERE user_id = ? AND date(created_at) = date('now')
    `).bind(user.id).first();

    // Récupérer le plan
    const plan = await c.env.DB.prepare(`
      SELECT p.* FROM plans p
      JOIN users u ON p.id = u.plan_id
      WHERE u.id = ?
    `).bind(user.id).first();

    return c.json(createApiResponse(true, {
      active_commands: activeCount?.count || 0,
      total_today: todayCount?.count || 0,
      plan_name: plan?.name || 'BASIC',
      features: plan ? JSON.parse(plan.features) : ['Affichage numéro']
    }));

  } catch (error) {
    console.error('Get stats error:', error);
    return c.json(createApiResponse(false, null, null, 'Erreur lors de la récupération des stats'), 500);
  }
});

export { commandRoutes };