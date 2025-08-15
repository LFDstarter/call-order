// JavaScript pour l'écran d'affichage TV
// Gestion temps réel, animations et affichage des appels

class DisplayScreen {
  constructor() {
    this.userId = window.userId; // Injecté depuis le HTML
    this.commands = [];
    this.displayData = {};
    this.isOnline = true;
    this.refreshInterval = 5000; // 5 secondes
    this.lastUpdate = null;
    
    this.init();
  }

  async init() {
    if (!this.userId) {
      this.showError('ID utilisateur manquant');
      return;
    }

    // Charger les données initiales
    await this.loadDisplayData();
    
    // Démarrer les mises à jour périodiques
    this.startPeriodicUpdates();
    
    // Mettre à jour l'heure
    this.startClock();
    
    // Gérer la reconnexion automatique
    this.handleVisibilityChange();
    
    console.log('Display screen initialized for user:', this.userId);
  }

  // === CHARGEMENT DES DONNÉES ===

  async loadDisplayData() {
    try {
      const response = await fetch(`/api/display/${this.userId}`);
      const result = await response.json();

      if (result.success) {
        this.displayData = result.data;
        this.commands = result.data.current_commands || [];
        this.updateDisplay();
        this.setOnlineStatus(true);
        this.lastUpdate = new Date();
      } else {
        console.error('Error loading display data:', result.error);
        this.setOnlineStatus(false);
      }
    } catch (error) {
      console.error('Network error loading display data:', error);
      this.setOnlineStatus(false);
    }
  }

  // === MISE À JOUR DE L'AFFICHAGE ===

  updateDisplay() {
    // Mettre à jour le nom du restaurant
    const restaurantNameEl = document.getElementById('restaurant-name');
    if (restaurantNameEl) {
      restaurantNameEl.textContent = this.displayData.restaurant_name || 'Restaurant';
      restaurantNameEl.style.color = this.displayData.brand_color || '#ffffff';
    }

    // Appliquer la couleur de marque
    if (this.displayData.brand_color) {
      document.documentElement.style.setProperty('--brand-color', this.displayData.brand_color);
    }

    // Afficher les commandes
    this.updateCommandsDisplay();
  }

  updateCommandsDisplay() {
    const commandsContainer = document.getElementById('commands-display');
    const noCommandsEl = document.getElementById('no-commands');
    
    if (!commandsContainer || !noCommandsEl) return;

    if (this.commands.length === 0) {
      commandsContainer.innerHTML = '';
      noCommandsEl.classList.remove('hidden');
      return;
    }

    noCommandsEl.classList.add('hidden');

    // Générer les cartes de commandes avec animations
    const commandsHTML = this.commands.map((command, index) => {
      const counterColor = command.counter_color || this.displayData.brand_color || '#3b82f6';
      const delay = index * 100; // Animation en cascade
      
      return `
        <div 
          class="command-card glass-effect rounded-2xl p-8 text-center animate-fade-in"
          style="animation-delay: ${delay}ms; border-left: 6px solid ${counterColor}"
          data-command-id="${command.id}"
        >
          <!-- Numéro de commande principal -->
          <div class="mb-6">
            <div 
              class="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-2xl pulse-glow"
              style="background: linear-gradient(135deg, ${counterColor}, ${this.adjustColor(counterColor, -20)});"
            >
              ${command.number}
            </div>
          </div>

          <!-- Informations de la commande -->
          <div class="space-y-4">
            ${command.message ? `
              <h3 class="text-2xl font-semibold text-white mb-2">${this.escapeHtml(command.message)}</h3>
            ` : ''}
            
            ${command.counter_name ? `
              <div class="flex items-center justify-center space-x-2 text-lg">
                <div 
                  class="w-4 h-4 rounded-full" 
                  style="background-color: ${counterColor};"
                ></div>
                <span class="text-gray-200">${this.escapeHtml(command.counter_name)}</span>
              </div>
            ` : ''}
            
            <!-- Heure de création -->
            <div class="text-gray-300 text-base">
              <i class="fas fa-clock mr-2"></i>
              ${this.formatDisplayTime(command.created_at)}
            </div>

            <!-- Indicateur de priorité si applicable -->
            ${command.priority > 0 ? `
              <div class="inline-flex items-center px-3 py-1 bg-red-500/20 rounded-full">
                <i class="fas fa-exclamation text-red-400 mr-2"></i>
                <span class="text-red-300 text-sm font-medium">PRIORITÉ</span>
              </div>
            ` : ''}
          </div>

          <!-- Animation de pulsation pour les nouvelles commandes -->
          ${this.isRecentCommand(command) ? `
            <div class="absolute inset-0 rounded-2xl animate-ping bg-white/10 pointer-events-none"></div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Transition fluide pour les changements
    if (commandsContainer.innerHTML !== commandsHTML) {
      commandsContainer.style.opacity = '0.7';
      setTimeout(() => {
        commandsContainer.innerHTML = commandsHTML;
        commandsContainer.style.opacity = '1';
      }, 200);
    }
  }

  // === GESTION DU TEMPS ===

  startClock() {
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('fr-FR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const clockEl = document.getElementById('current-time');
      if (clockEl) {
        clockEl.textContent = timeString;
      }
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  // === MISES À JOUR PÉRIODIQUES ===

  startPeriodicUpdates() {
    const update = async () => {
      await this.loadDisplayData();
      
      // Adapter la fréquence selon le nombre de commandes
      const adaptiveInterval = this.commands.length > 0 ? 3000 : 10000; // 3s si actif, 10s si vide
      setTimeout(update, adaptiveInterval);
    };

    setTimeout(update, this.refreshInterval);
  }

  // === GESTION DE LA CONNECTIVITÉ ===

  setOnlineStatus(online) {
    this.isOnline = online;
    
    // Ajouter/supprimer un indicateur de statut
    let statusIndicator = document.getElementById('connection-status');
    
    if (!online) {
      if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'connection-status';
        statusIndicator.className = 'fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Connexion interrompue';
        document.body.appendChild(statusIndicator);
      }
    } else {
      if (statusIndicator) {
        document.body.removeChild(statusIndicator);
      }
    }
  }

  handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isOnline) {
        // Page redevient visible et on est offline, essayer de reconnecter
        this.loadDisplayData();
      }
    });
  }

  // === UTILITAIRES ===

  formatDisplayTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'À l\'instant';
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  isRecentCommand(command) {
    const commandTime = new Date(command.created_at);
    const now = new Date();
    const diffMs = now - commandTime;
    return diffMs < 60000; // Moins d'une minute
  }

  adjustColor(color, percent) {
    // Ajuster la luminosité d'une couleur hex
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    document.body.innerHTML = `
      <div class="min-h-screen display-screen flex items-center justify-center">
        <div class="text-center text-white">
          <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
          <h1 class="text-3xl font-bold mb-4">Erreur d'affichage</h1>
          <p class="text-xl text-gray-300">${message}</p>
          <button 
            onclick="location.reload()" 
            class="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    `;
  }

  // === FONCTIONNALITÉS PREMIUM (pour futurs ajouts) ===

  async markAsAnnounced(commandId) {
    try {
      await fetch(`/api/display/${this.userId}/announce/${commandId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking command as announced:', error);
    }
  }

  // Gestion des publicités (plan GOLDEN)
  async loadAds() {
    try {
      const response = await fetch(`/api/display/${this.userId}/ads`);
      const result = await response.json();

      if (result.success) {
        // Implémenter la logique des publicités
        console.log('Ads loaded:', result.data);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  }
}

// Styles CSS additionnels injectés dynamiquement
const additionalStyles = `
  <style>
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s ease-out forwards;
    }
    
    .command-card {
      position: relative;
      transition: all 0.3s ease;
      will-change: transform;
    }
    
    .command-card:hover {
      transform: translateY(-5px);
    }
    
    .pulse-glow {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
    }
    
    /* Styles responsives pour différentes tailles d'écran */
    @media (max-width: 768px) {
      .command-card {
        padding: 1.5rem;
      }
      
      .command-card .w-24.h-24 {
        width: 4rem;
        height: 4rem;
      }
      
      .command-card .text-4xl {
        font-size: 2rem;
      }
    }
    
    /* Animation pour les nouvelles commandes */
    @keyframes new-command-highlight {
      0% { background-color: rgba(34, 197, 94, 0.2); }
      100% { background-color: transparent; }
    }
    
    .new-command {
      animation: new-command-highlight 2s ease-out;
    }
  </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Initialiser l'écran d'affichage
const displayScreen = new DisplayScreen();