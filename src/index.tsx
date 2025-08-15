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
            --aqua-primary: #119DA4;
            --aqua-medium: #0C7489;
            --aqua-dark: #13505B;
            --aqua-black: #040404;
            --aqua-gray: #D7D9CE;
            --white: #ffffff;
            --light-gray: #f8fafc;
            --border-light: rgba(17, 157, 164, 0.1);
            --shadow-soft: rgba(17, 157, 164, 0.15);
          }
          .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px);
            border: 1px solid var(--border-light);
            box-shadow: 0 8px 30px var(--shadow-soft);
          }
          .gradient-bg {
            background: linear-gradient(135deg, var(--white) 0%, var(--light-gray) 100%);
          }
          .header-gradient {
            background: linear-gradient(135deg, var(--aqua-primary) 0%, var(--aqua-medium) 100%);
          }
          .btn-primary {
            background: linear-gradient(135deg, var(--aqua-primary) 0%, var(--aqua-medium) 100%);
            border: none;
            color: white;
            transition: all 0.3s ease;
          }
          .btn-primary:hover {
            background: linear-gradient(135deg, var(--aqua-medium) 0%, var(--aqua-dark) 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(17, 157, 164, 0.4);
          }
          .stat-card {
            background: var(--white);
            border: 1px solid var(--border-light);
            border-radius: 16px;
            transition: all 0.3s ease;
          }
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px var(--shadow-soft);
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
                        <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-phone text-xl" style="color: var(--aqua-primary);"></i>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-white">Call Orders</h1>
                            <p class="text-sm text-white/80">Modern SaaS Dashboard</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-sm border border-white/20">
                            <i class="fas fa-crown mr-2 text-yellow-300"></i>
                            PREMIUM
                        </div>
                        <button class="bg-white/10 backdrop-blur-sm p-2 rounded-xl text-white hover:bg-white/20 transition-all duration-200 border border-white/20">
                            <i class="fas fa-user-circle text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Contenu principal -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Stats rapides avec design Aqua Whimsy -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="stat-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">Appels actifs</p>
                            <p class="text-3xl font-bold mt-2" style="color: var(--aqua-dark);" id="active-commands">3</p>
                        </div>
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, var(--aqua-primary), var(--aqua-medium));">
                            <i class="fas fa-clock text-xl text-white"></i>
                        </div>
                    </div>
                </div>
                <div class="stat-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">Total aujourd'hui</p>
                            <p class="text-3xl font-bold mt-2" style="color: var(--aqua-dark);" id="total-today">27</p>
                        </div>
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, var(--aqua-medium), var(--aqua-dark));">
                            <i class="fas fa-chart-line text-xl text-white"></i>
                        </div>
                    </div>
                </div>
                <div class="stat-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm font-medium">Temps moyen</p>
                            <p class="text-3xl font-bold mt-2" style="color: var(--aqua-dark);">4:32</p>
                        </div>
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, var(--aqua-dark), var(--aqua-black));">
                            <i class="fas fa-stopwatch text-xl text-white"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Envoi rapide de commande avec design Aqua Whimsy -->
            <div class="stat-card p-6 mb-8">
                <h2 class="text-xl font-semibold mb-6 flex items-center" style="color: var(--aqua-dark);">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style="background: linear-gradient(135deg, var(--aqua-primary), var(--aqua-medium));">
                        <i class="fas fa-plus text-white text-sm"></i>
                    </div>
                    Nouvel Appel
                </h2>
                <div class="space-y-4">
                    <!-- Ligne 1: Numéro et Type -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">Numéro d'appel</label>
                            <input
                                type="text"
                                id="command-number"
                                placeholder="Numéro"
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all duration-200"
                                maxlength="4"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">Type d'appel</label>
                            <select id="service-type-select" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:bg-white transition-all duration-200">
                                <option value="Guichet">Guichet</option>
                                <option value="Commande">Commande</option>
                                <option value="Client">Client</option>
                                <option value="Numéro">Numéro seulement</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Ligne 2: Message et Position -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">Message personnalisé</label>
                            <input
                                type="text"
                                id="command-message"
                                placeholder="Veuillez vous présenter, est prêt, etc."
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">Position du message</label>
                            <select id="message-position" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:bg-white transition-all duration-200">
                                <option value="before">Message avant le numéro</option>
                                <option value="after">Message après le numéro</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Ligne 3: Boutons -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onclick="sendCommand()"
                            class="btn-primary w-full font-semibold py-3 px-6 rounded-xl"
                        >
                            <i class="fas fa-paper-plane mr-2"></i>
                            Envoyer l'Appel
                        </button>
                        <button
                            onclick="sendNextCommand()"
                            class="btn-primary w-full font-semibold py-3 px-6 rounded-xl"
                            style="background: linear-gradient(135deg, #0C7489, #13505B);"
                        >
                            <i class="fas fa-arrow-right mr-2"></i>
                            Numéro Suivant
                        </button>
                    </div>
                </div>
            </div>

            <!-- Liste des commandes actives -->
            <div class="stat-card p-6">
                <h2 class="text-xl font-semibold mb-6 flex items-center" style="color: var(--aqua-dark);">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style="background: linear-gradient(135deg, var(--aqua-medium), var(--aqua-dark));">
                        <i class="fas fa-list text-white text-sm"></i>
                    </div>
                    Appels Actifs
                </h2>
                <div id="commands-list" class="space-y-4">
                    <!-- Les commandes seront chargées ici -->
                </div>
            </div>

            <!-- Bouton vers l'écran d'affichage -->
            <div class="mt-8 text-center">
                <button
                    onclick="openDisplayScreen()"
                    class="btn-primary px-8 py-4 rounded-xl inline-flex items-center space-x-3 shadow-lg"
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
            --aqua-primary: #119DA4;
            --aqua-medium: #0C7489;
            --aqua-dark: #13505B;
            --aqua-black: #040404;
            --aqua-gray: #D7D9CE;
          }
          .display-screen {
            background: linear-gradient(135deg, var(--aqua-dark) 0%, var(--aqua-black) 20%, var(--aqua-medium) 50%, var(--aqua-primary) 80%, var(--aqua-medium) 100%);
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
            box-shadow: 0 25px 50px -12px rgba(4, 4, 4, 0.3);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(17, 157, 164, 0.2);
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .pulse-glow {
            animation: pulse-glow 2s infinite;
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(17, 157, 164, 0.4); }
            50% { box-shadow: 0 0 50px rgba(17, 157, 164, 0.7); }
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