import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings, Variables } from './types';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { commandRoutes } from './routes/commands';
import { userRoutes } from './routes/users';
import { displayRoutes } from './routes/display';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS pour API
app.use('/api/*', cors());

// Servir les fichiers statiques
app.use('/static/*', serveStatic({ root: './public' }));

// Routes API
app.route('/api/auth', authRoutes);
app.route('/api/commands', commandRoutes);
app.route('/api/users', userRoutes);
app.route('/api/display', displayRoutes);

// Page principale - Dashboard moderne
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Call Orders - Dashboard SaaS</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          :root {
            --primary-pink: #F72585;
            --primary-magenta: #B5179E;
            --primary-purple: #7209B7;
            --primary-royal: #560BAD;
            --primary-violet: #480CA8;
            --secondary-blue-purple: #3A0CA3;
            --secondary-blue: #3F37C9;
            --secondary-bold-blue: #4361EE;
            --secondary-moderate-blue: #4895EF;
            --secondary-cyan: #4CC9F0;
          }
          .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(114, 9, 183, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          .gradient-bg {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }
          .header-gradient {
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--secondary-bold-blue) 100%);
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        </style>
    </head>
    <body class="min-h-screen bg-gray-50">
        <!-- Header moderne -->
        <header class="header-gradient shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <i class="fas fa-phone text-xl" style="color: var(--primary-purple);"></i>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-white">Call Orders</h1>
                            <p class="text-sm text-gray-100">SaaS Dashboard</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="glass-effect px-3 py-2 rounded-lg text-white text-sm" style="background: linear-gradient(90deg, var(--primary-magenta), var(--secondary-bold-blue));">
                            <i class="fas fa-crown mr-2" style="color: var(--secondary-cyan);"></i>
                            PREMIUM
                        </div>
                        <button class="glass-effect p-2 rounded-lg text-white hover:bg-white/20 transition-colors">
                            <i class="fas fa-user-circle text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Contenu principal -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Stats rapides -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="glass-effect rounded-xl p-6 text-gray-800">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Commandes actives</p>
                            <p class="text-3xl font-bold" id="active-commands">3</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--secondary-cyan);">
                            <i class="fas fa-clock text-xl text-white"></i>
                        </div>
                    </div>
                </div>
                <div class="glass-effect rounded-xl p-6 text-gray-800">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Total aujourd'hui</p>
                            <p class="text-3xl font-bold" id="total-today">27</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--secondary-moderate-blue);">
                            <i class="fas fa-chart-line text-xl text-white"></i>
                        </div>
                    </div>
                </div>
                <div class="glass-effect rounded-xl p-6 text-gray-800">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm">Temps moyen</p>
                            <p class="text-3xl font-bold">4:32</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--primary-magenta);">
                            <i class="fas fa-stopwatch text-xl text-white"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Envoi rapide de commande -->
            <div class="glass-effect rounded-xl p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-plus-circle mr-3" style="color: var(--secondary-cyan);"></i>
                    Nouvelle Commande
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <input
                            type="text"
                            id="command-number"
                            placeholder="N° commande"
                            class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            maxlength="4"
                        />
                    </div>
                    <div>
                        <select id="counter-select" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                            <option value="">Guichet</option>
                            <option value="counter-1">Comptoir Principal</option>
                            <option value="counter-2">Drive & Emporter</option>
                        </select>
                    </div>
                    <div>
                        <input
                            type="text"
                            id="command-message"
                            placeholder="Message (optionnel)"
                            class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <button
                            onclick="sendCommand()"
                            class="w-full text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                            style="background: linear-gradient(135deg, var(--primary-purple), var(--secondary-bold-blue)); box-shadow: 0 4px 15px rgba(114, 9, 183, 0.3);"
                        >
                            <i class="fas fa-paper-plane mr-2"></i>
                            Envoyer
                        </button>
                    </div>
                </div>
            </div>

            <!-- Liste des commandes actives -->
            <div class="glass-effect rounded-xl p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-list-ul mr-3" style="color: var(--secondary-moderate-blue);"></i>
                    Commandes Actives
                </h2>
                <div id="commands-list" class="space-y-4">
                    <!-- Les commandes seront chargées ici -->
                </div>
            </div>

            <!-- Bouton vers l'écran d'affichage -->
            <div class="mt-8 text-center">
                <button
                    onclick="openDisplayScreen()"
                    class="glass-effect text-white px-8 py-4 rounded-xl hover:bg-white/20 transition-colors inline-flex items-center space-x-3"
                >
                    <i class="fas fa-tv text-2xl"></i>
                    <span class="text-lg font-semibold">Ouvrir l'Écran d'Affichage</span>
                </button>
            </div>
        </main>

        <!-- Scripts -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

// Page d'écran d'affichage pour TV
app.get('/display/:userId', async (c) => {
  const userId = c.req.param('userId');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Écran d'Affichage - Call Orders</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          :root {
            --primary-pink: #F72585;
            --primary-magenta: #B5179E;
            --primary-purple: #7209B7;
            --primary-royal: #560BAD;
            --primary-violet: #480CA8;
            --secondary-blue-purple: #3A0CA3;
            --secondary-blue: #3F37C9;
            --secondary-bold-blue: #4361EE;
            --secondary-moderate-blue: #4895EF;
            --secondary-cyan: #4CC9F0;
          }
          .display-screen {
            background: linear-gradient(135deg, var(--primary-violet) 0%, var(--secondary-blue-purple) 20%, var(--primary-royal) 50%, var(--secondary-blue) 80%, var(--primary-purple) 100%);
            background-size: 400% 400%;
            animation: gradient-shift 20s ease infinite;
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .command-card {
            animation: slideIn 0.5s ease-out;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .pulse-glow {
            animation: pulse-glow 2s infinite;
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 50px rgba(59, 130, 246, 0.6); }
          }
        </style>
    </head>
    <body class="min-h-screen display-screen flex flex-col">
        <!-- Header du restaurant -->
        <header class="bg-black/20 backdrop-blur-sm border-b border-white/10 py-6">
            <div class="max-w-7xl mx-auto px-8 flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-4xl font-bold text-white mb-2" id="restaurant-name">Restaurant Le Gourmet</h1>
                    <p class="text-xl text-gray-200">Commandes Prêtes</p>
                </div>
            </div>
        </header>

        <!-- Zone d'affichage des commandes -->
        <main class="flex-1 p-8">
            <div id="commands-display" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                <!-- Commandes affichées dynamiquement -->
            </div>

            <!-- Message quand aucune commande -->
            <div id="no-commands" class="text-center text-white py-16 hidden">
                <i class="fas fa-check-circle text-6xl mb-6 text-green-400"></i>
                <h2 class="text-3xl font-semibold mb-4">Toutes les commandes sont servies !</h2>
                <p class="text-xl text-gray-300">Prêt pour les prochaines commandes...</p>
            </div>
        </main>

        <!-- Footer avec heure -->
        <footer class="bg-black/20 backdrop-blur-sm border-t border-white/10 py-4">
            <div class="max-w-7xl mx-auto px-8 text-center">
                <p class="text-gray-300 text-lg" id="current-time">--:--:--</p>
            </div>
        </footer>

        <script>
          window.userId = '${userId}';
        </script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/display.js"></script>
    </body>
    </html>
  `);
});

export default app;