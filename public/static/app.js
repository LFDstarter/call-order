// JavaScript principal pour Call Orders - Dashboard SaaS
// Gestion moderne avec API calls, état local et UX fluide

class RestaurantDashboard {
  constructor() {
    this.user = null;
    this.commands = [];
    this.counters = [];
    this.stats = {};
    
    // Configuration API
    this.apiBase = '/api';
    this.token = localStorage.getItem('call_orders_token');
    
    this.init();
  }

  async init() {
    // Vérifier l'authentification
    if (this.token) {
      await this.loadUserProfile();
      await this.loadDashboardData();
    } else {
      this.showLoginForm();
    }
    
    this.bindEvents();
    this.startPeriodicUpdates();
  }

  // === AUTHENTIFICATION ===
  
  showLoginForm() {
    document.body.innerHTML = `
      <div class="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div class="glass-effect rounded-2xl p-8 w-full max-w-md">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-phone text-2xl" style="color: #7209B7;"></i>
            </div>
            <h1 class="text-2xl font-bold text-white mb-2">Call Orders</h1>
            <p class="text-gray-200">Connexion à votre dashboard</p>
          </div>
          
          <div id="auth-forms">
            <!-- Formulaire de connexion -->
            <form id="login-form" class="space-y-6">
              <div>
                <input
                  type="email"
                  id="login-email"
                  placeholder="Email"
                  required
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  id="login-password"
                  placeholder="Mot de passe"
                  required
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                class="w-full text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                style="background: linear-gradient(135deg, #119DA4 0%, #0C7489 100%); box-shadow: 0 6px 20px rgba(17, 157, 164, 0.3);"
              >
                Se connecter
              </button>
            </form>
            
            <!-- Lien vers inscription -->
            <div class="mt-6 text-center">
              <p class="text-gray-300">
                Pas encore de compte ?
                <button id="show-register" class="text-blue-400 hover:text-blue-300 font-medium">
                  S'inscrire
                </button>
              </p>
            </div>
            
            <!-- Connexion demo -->
            <div class="mt-4 pt-4 border-t border-white/20">
              <button
                id="demo-login"
                class="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg transition-colors border border-white/20"
              >
                <i class="fas fa-play-circle mr-2"></i>
                Essai démo
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.bindAuthEvents();
  }

  bindAuthEvents() {
    // Formulaire de connexion
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      await this.login(email, password);
    });
    
    // Bouton inscription
    document.getElementById('show-register').addEventListener('click', () => {
      this.showRegisterForm();
    });
    
    // Connexion démo
    document.getElementById('demo-login').addEventListener('click', async () => {
      await this.login('demo@restaurant-orders.com', 'demo123');
    });
  }

  showRegisterForm() {
    const authForms = document.getElementById('auth-forms');
    authForms.innerHTML = `
      <form id="register-form" class="space-y-6">
        <div>
          <input
            type="email"
            id="register-email"
            placeholder="Email"
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <input
            type="password"
            id="register-password"
            placeholder="Mot de passe (min 6 caractères)"
            required
            minlength="6"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <input
            type="text"
            id="register-restaurant"
            placeholder="Nom de votre restaurant"
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          style="background: linear-gradient(135deg, #0C7489 0%, #13505B 100%); box-shadow: 0 6px 20px rgba(12, 116, 137, 0.3);"
        >
          Créer mon compte
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-gray-300">
          Déjà un compte ?
          <button id="show-login" class="text-blue-400 hover:text-blue-300 font-medium">
            Se connecter
          </button>
        </p>
      </div>
    `;
    
    // Formulaire d'inscription
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const restaurant_name = document.getElementById('register-restaurant').value;
      await this.register(email, password, restaurant_name);
    });
    
    // Retour à la connexion
    document.getElementById('show-login').addEventListener('click', () => {
      this.showLoginForm();
    });
  }

  async login(email, password) {
    try {
      const response = await this.apiCall('/auth/login', 'POST', { email, password });
      
      if (response.success) {
        this.token = response.data.token;
        this.user = response.data.user;
        localStorage.setItem('call_orders_token', this.token);
        
        this.showNotification('Connexion réussie !', 'success');
        location.reload(); // Recharger pour afficher le dashboard
      } else {
        this.showNotification(response.error || 'Erreur de connexion', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  async register(email, password, restaurant_name) {
    try {
      const response = await this.apiCall('/auth/register', 'POST', { 
        email, 
        password, 
        restaurant_name 
      });
      
      if (response.success) {
        this.token = response.data.token;
        this.user = response.data.user;
        localStorage.setItem('call_orders_token', this.token);
        
        this.showNotification('Inscription réussie ! Bienvenue !', 'success');
        location.reload();
      } else {
        this.showNotification(response.error || 'Erreur d\'inscription', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      this.showNotification('Erreur d\'inscription', 'error');
    }
  }

  async logout() {
    try {
      await this.apiCall('/auth/logout', 'POST');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    this.token = null;
    this.user = null;
    localStorage.removeItem('call_orders_token');
    this.showLoginForm();
  }

  // === GESTION DES DONNÉES ===

  async loadUserProfile() {
    try {
      const response = await this.apiCall('/users/profile');
      if (response.success) {
        this.user = response.data;
        this.counters = response.data.counters || [];
      }
    } catch (error) {
      console.error('Load profile error:', error);
      if (error.status === 401) {
        this.logout();
      }
    }
  }

  async loadDashboardData() {
    try {
      // Charger les stats
      const statsResponse = await this.apiCall('/commands/stats');
      if (statsResponse.success) {
        this.stats = statsResponse.data;
        this.updateStatsDisplay();
      }

      // Charger les appels actifs
      const commandsResponse = await this.apiCall('/commands?status=active');
      if (commandsResponse.success) {
        this.commands = commandsResponse.data.commands || [];
        this.updateCommandsList();
      }

      // Mettre à jour les sélecteurs de guichets
      this.updateCounterSelectors();

    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  }

  // === INTERFACE UTILISATEUR ===

  updateStatsDisplay() {
    const activeEl = document.getElementById('active-commands');
    const todayEl = document.getElementById('total-today');
    
    if (activeEl) activeEl.textContent = this.stats.active_commands || 0;
    if (todayEl) todayEl.textContent = this.stats.total_today || 0;
  }

  updateCommandsList() {
    const listEl = document.getElementById('commands-list');
    if (!listEl) return;

    if (this.commands.length === 0) {
      listEl.innerHTML = `
        <div class="text-center py-8 text-gray-300">
          <i class="fas fa-clock text-4xl mb-4 opacity-50"></i>
          <p>Aucun appel actif</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.commands.map(command => `
      <div class="card-modern p-4 flex items-center justify-between command-item" data-id="${command.id}">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #119DA4, #0C7489);">
            <span class="text-white font-bold text-lg">${command.number}</span>
          </div>
          <div>
            <p class="font-semibold" style="color: #13505B;">${command.message || 'Appel n° ' + command.number}</p>
            <p class="text-gray-500 text-sm">
              ${command.counter_name || 'Service principal'} • 
              ${this.formatDate(command.created_at)}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            onclick="dashboard.completeCommand('${command.id}')"
            class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            title="Marquer comme terminé"
          >
            <i class="fas fa-check"></i>
          </button>
          <button
            onclick="dashboard.cancelCommand('${command.id}')"
            class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            title="Annuler"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  updateCounterSelectors() {
    const counterSelect = document.getElementById('counter-select');
    if (!counterSelect) return;

    counterSelect.innerHTML = '<option value="">Guichet</option>' +
      this.counters.map(counter => 
        `<option value="${counter.id}" style="background-color: ${counter.color}">${counter.name}</option>`
      ).join('');
  }

  // === GESTION DES COMMANDES ===

  async sendCommand() {
    const numberEl = document.getElementById('command-number');
    const serviceTypeEl = document.getElementById('service-type-select');
    const messageEl = document.getElementById('command-message');
    const messagePositionEl = document.getElementById('message-position');

    const number = numberEl.value.trim();
    const serviceType = serviceTypeEl.value;
    const userMessage = messageEl.value.trim();
    const messagePosition = messagePositionEl.value;

    if (!number) {
      this.showNotification('Veuillez saisir un numéro', 'error');
      return;
    }

    if (!/^[A-Za-z0-9]{1,4}$/.test(number)) {
      this.showNotification('Numéro invalide (1-4 caractères, lettres et chiffres uniquement)', 'error');
      return;
    }

    // Construire le message final selon la position et le type
    let finalMessage = '';
    
    if (serviceType === 'Numéro') {
      // Numéro seulement - pas de type affiché
      if (userMessage) {
        if (messagePosition === 'before') {
          finalMessage = `${userMessage} N°${number}`;
        } else {
          finalMessage = `N°${number} - ${userMessage}`;
        }
      } else {
        finalMessage = `N°${number}`;
      }
    } else {
      // Avec type (Guichet, Commande, Client)
      if (userMessage) {
        if (messagePosition === 'before') {
          finalMessage = `${userMessage} au ${serviceType} N°${number}`;
        } else {
          finalMessage = `${serviceType} N°${number} - ${userMessage}`;
        }
      } else {
        finalMessage = `${serviceType} N°${number}`;
      }
    }

    try {
      const response = await this.apiCall('/commands', 'POST', {
        number,
        message: finalMessage
      });

      if (response.success) {
        this.showNotification(`Appel n°${number} envoyé !`, 'success');
        
        // Réinitialiser le formulaire
        numberEl.value = '';
        messageEl.value = '';
        
        // Recharger les données
        await this.loadDashboardData();
      } else {
        this.showNotification(response.error || 'Erreur lors de l\'envoi', 'error');
      }
    } catch (error) {
      console.error('Send command error:', error);
      this.showNotification('Erreur lors de l\'envoi', 'error');
    }
  }

  async sendNextCommand() {
    const numberEl = document.getElementById('command-number');
    const currentNumber = numberEl.value.trim();
    
    if (!currentNumber || !/^\d+$/.test(currentNumber)) {
      this.showNotification('Entrez d\'abord un numéro pour calculer le suivant', 'error');
      return;
    }
    
    const nextNumber = (parseInt(currentNumber) + 1).toString();
    numberEl.value = nextNumber;
    
    // Envoyer automatiquement le numéro suivant
    await this.sendCommand();
  }

  async completeCommand(commandId) {
    try {
      const response = await this.apiCall(`/commands/${commandId}`, 'PUT', {
        status: 'completed'
      });

      if (response.success) {
        this.showNotification('Appel terminé', 'success');
        await this.loadDashboardData();
      } else {
        this.showNotification('Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      console.error('Complete command error:', error);
      this.showNotification('Erreur lors de la mise à jour', 'error');
    }
  }

  async cancelCommand(commandId) {
    try {
      const response = await this.apiCall(`/commands/${commandId}`, 'PUT', {
        status: 'cancelled'
      });

      if (response.success) {
        this.showNotification('Appel annulé', 'success');
        await this.loadDashboardData();
      } else {
        this.showNotification('Erreur lors de l\'annulation', 'error');
      }
    } catch (error) {
      console.error('Cancel command error:', error);
      this.showNotification('Erreur lors de l\'annulation', 'error');
    }
  }

  // === UTILITAIRES ===

  async apiCall(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.apiBase}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw { status: response.status, ...result };
    }

    return result;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    if (type === 'success') {
      notification.className += ' bg-green-600 text-white';
    } else if (type === 'error') {
      notification.className += ' bg-red-600 text-white';
    } else {
      notification.className += ' bg-blue-600 text-white';
    }

    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Animer l'apparition
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Supprimer après 4 secondes
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  }

  openDisplayScreen() {
    if (!this.user) return;
    const url = `/display/${this.user.id}`;
    window.open(url, '_blank');
  }

  bindEvents() {
    // Envoi d'appel avec Enter
    document.addEventListener('keypress', (e) => {
      if (e.target.id === 'command-number' && e.key === 'Enter') {
        e.preventDefault();
        this.sendCommand();
      }
    });
  }

  startPeriodicUpdates() {
    // Recharger les données toutes les 30 secondes
    setInterval(() => {
      if (this.token && this.user) {
        this.loadDashboardData();
      }
    }, 30000);
  }
}

// Fonctions globales (appelées depuis le HTML)
function sendCommand() {
  if (window.dashboard) {
    window.dashboard.sendCommand();
  }
}

function sendNextCommand() {
  if (window.dashboard) {
    window.dashboard.sendNextCommand();
  }
}

function openDisplayScreen() {
  if (window.dashboard) {
    window.dashboard.openDisplayScreen();
  }
}

// Initialiser le dashboard
window.dashboard = new RestaurantDashboard();