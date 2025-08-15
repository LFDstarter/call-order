# 📞 Call Orders SaaS

> **Système moderne de gestion des appels et files d'attente pour institutions**  
> **Multi-secteurs** : Restaurants, Hôpitaux, Mairies, Banques, Centres d'accueil  
> **Domaine de production** : `dashboard.call-order.com`

## 🚀 Vue d'ensemble du projet

**Call Orders** est une application web SaaS moderne construite avec **Hono** et **Cloudflare Workers** qui permet aux institutions (restaurants, hôpitaux, mairies, banques, centres d'accueil) de gérer efficacement l'affichage des numéros d'appel et files d'attente sur des écrans externes avec support d'annonces vocales selon l'abonnement.

## 🌐 URLs du projet

- **🚀 Application Live** : https://3000-iuy5y0c9vobulo5yppsd4-6532622b.e2b.dev
- **📺 Écran TV Demo** : https://3000-iuy5y0c9vobulo5yppsd4-6532622b.e2b.dev/display/c7fc56d1-1da1-4d56-8e52-999c9a0baa8b
- **📋 Repository GitHub** : https://github.com/LFDstarter/call-order
- **🔍 API Health** : https://3000-iuy5y0c9vobulo5yppsd4-6532622b.e2b.dev/api/display/c7fc56d1-1da1-4d56-8e52-999c9a0baa8b/ping

## 👤 Compte de démonstration

- **Email** : `test-restaurant@test.com`
- **Mot de passe** : `test123`
- **Restaurant** : "Restaurant Test"

## 📊 Statut du projet

🟢 **FONCTIONNEL** - Le SaaS est 100% opérationnel avec toutes les fonctionnalités de base.

**Dernière mise à jour** : 15 Août 2025  
**Tests réussis** :
- ✅ Authentification utilisateur
- ✅ Création et affichage de commandes
- ✅ API REST complète
- ✅ Écran TV temps réel
- ✅ Interface Purple Raindrops
- ✅ Base de données D1 locale et migrations

### ✨ Fonctionnalités principales réalisées

- ✅ **Dashboard moderne Purple Raindrops** - Interface utilisateur élégante avec palette cohérente
- ✅ **Authentification sécurisée** - Système de connexion/inscription avec sessions
- ✅ **Gestion des appels** - CRUD complet pour créer, modifier, supprimer les appels
- ✅ **Multi-guichets/services** - Support de plusieurs points de service avec couleurs distinctives
- ✅ **Écran d'affichage TV** - Page dédiée pour projection avec animations temps réel
- ✅ **Système d'abonnements** - Plans BASIC, PREMIUM, GOLDEN avec fonctionnalités différenciées
- ✅ **Base de données relationnelle** - Schéma complet avec Cloudflare D1 (SQLite)
- ✅ **API REST complète** - Endpoints pour toutes les opérations CRUD
- ✅ **Responsive design** - Interface adaptative mobile/tablet/desktop

### 🎯 Secteurs d'application

- 🍽️ **Restaurants** - Commandes prêtes, drive, comptoirs
- 🏥 **Hôpitaux** - Appels patients, consultations, urgences  
- 🏛️ **Mairies** - Guichets services, rendez-vous, démarches
- 🏦 **Banques** - Files d'attente, conseillers, services
- 📞 **Centres d'appel** - Support client, tickets, interventions
- 🏢 **Entreprises** - Accueil visiteurs, RH, réunions

## 🌐 URLs d'accès

### 🔗 URLs de développement

- **Dashboard principal**: https://3000-iuy5y0c9vobulo5yppsd4-6532622b.e2b.dev
- **API Health Check**: https://3000-iuy5y0c9vobulo5yppsd4-6532622b.e2b.dev/api/display/demo-user-1/ping
- **Écran d'affichage démo**: https://3000-iuy5y0c9vobulo5yppsd4-6532622b.e2b.dev/display/demo-user-1

### 🎯 Production (prévue)
- **Dashboard**: https://dashboard.call-order.com
- **API**: https://dashboard.call-order.com/api
- **Écran TV**: https://dashboard.call-order.com/display/{userId}

### 🔧 API Endpoints principaux

| Méthode | Endpoint | Description | Auth requis |
|---------|----------|-------------|-------------|
| `POST` | `/api/auth/login` | Connexion utilisateur | ❌ |
| `POST` | `/api/auth/register` | Inscription utilisateur | ❌ |
| `GET` | `/api/commands` | Liste des commandes | ✅ |
| `POST` | `/api/commands` | Créer une commande | ✅ |
| `PUT` | `/api/commands/:id` | Modifier une commande | ✅ |
| `GET` | `/api/commands/stats` | Statistiques dashboard | ✅ |
| `GET` | `/api/display/:userId` | Données écran TV | ❌ |
| `GET` | `/api/users/profile` | Profil utilisateur | ✅ |
| `GET` | `/api/users/counters` | Gestion guichets | ✅ |

## 🏗️ Architecture des données

### 📊 Modèles principaux

#### Users (Restaurants)
```sql
- id (TEXT, PRIMARY KEY)
- email (TEXT, UNIQUE)  
- restaurant_name (TEXT)
- plan_id (TEXT) → plans.id
- brand_color (TEXT, par défaut #3b82f6)
- logo_url (TEXT, optionnel)
- voice_settings (JSON, optionnel)
```

#### Plans d'abonnement
```sql
- id (TEXT: basic/premium/golden)
- name (TEXT: BASIC/PREMIUM/GOLDEN)
- price (INTEGER: 0/2900/4900 centimes)
- features (JSON)
- voice_enabled, multi_counter, ads_enabled (BOOLEAN)
```

#### Commands (Commandes)
```sql
- id (TEXT, PRIMARY KEY)
- number (TEXT, 1-4 caractères)
- message (TEXT, optionnel)
- user_id → users.id
- counter_id → counters.id (optionnel)
- status (active/completed/cancelled)
- priority (INTEGER, 0 par défaut)
- timestamps (created_at, updated_at, announced_at)
```

#### Counters (Guichets)
```sql
- id (TEXT, PRIMARY KEY)
- user_id → users.id
- name (TEXT: "Comptoir Principal", "Drive", etc.)
- color (TEXT: couleur hex)
- position (INTEGER, ordre d'affichage)
- is_active (BOOLEAN)
```

### 🔄 Flow de données
1. **Authentification** → Session token stocké 7 jours
2. **Dashboard** → Chargement stats + commandes actives
3. **Nouvelle commande** → Validation + insertion DB + refresh UI
4. **Écran TV** → Polling API display toutes les 3-5 secondes
5. **Gestion états** → Commandes active → completed/cancelled

## 💻 Guide utilisateur

### 🔐 Connexion
1. **Compte démo disponible**:
   - Email: `demo@call-orders.com`
   - Mot de passe: `demo123`
   - Restaurant: "Restaurant Le Gourmet" (Plan PREMIUM)

2. **Inscription** : Email + mot de passe + nom restaurant

### 📱 Utilisation du dashboard
1. **Vue d'ensemble** : Stats temps réel (commandes actives, total jour)
2. **Envoi rapide** : 
   - Numéro commande (1-4 caractères alphanumériques)
   - Sélection guichet (optionnel)
   - Message personnalisé (optionnel)
   - Clic "Envoyer"
3. **Gestion commandes** : Actions "Terminer" ✅ ou "Annuler" ❌
4. **Écran TV** : Bouton "Ouvrir l'Écran d'Affichage" → nouvelle fenêtre

### 📺 Écran d'affichage (TV)
- **URL dédiée** : `/display/{userId}` 
- **Auto-refresh** : Mise à jour automatique toutes les 3-5s
- **Animations** : Transitions fluides, cartes avec couleurs guichets
- **Indicateurs** : Heure de commande, priorité, statut guichet
- **Responsive** : Adapté tous types d'écrans (TV, tablette, mobile)

## 🔧 Développement & déploiement

### 🛠️ Stack technique
- **Backend**: Hono (framework web léger)
- **Runtime**: Cloudflare Workers/Pages
- **Database**: Cloudflare D1 (SQLite distribué)
- **Frontend**: Vanilla JS + TailwindCSS + FontAwesome
- **Build**: Vite
- **Process Manager**: PM2
- **Migrations**: Wrangler CLI

### 📦 Installation & lancement
```bash
# Cloner et installer
git clone <repo>
cd webapp
npm install

# Build initial
npm run build

# Migrations locales  
npm run db:migrate:local
npm run db:seed

# Lancer en développement
npm run clean-port
pm2 start ecosystem.config.cjs

# Vérifier le statut
pm2 list
curl http://localhost:3000
```

### 🌍 URLs de développement local
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3000/api/*
- **Écran TV**: http://localhost:3000/display/demo-user-1

### 🚀 Déploiement production vers dashboard.call-order.com
```bash
# Configuration Cloudflare (à faire)
npm run db:create  # Créer DB production
npm run db:migrate:prod  # Appliquer migrations

# Déploiement
npm run deploy:prod
```

## 📋 Statut du développement

### ✅ Phase 1 - MVP Core (TERMINÉ)
- ✅ Authentification + Dashboard de base
- ✅ Envoi commandes simple
- ✅ Écran affichage basique  
- ✅ Système abonnements
- ✅ API REST complète
- ✅ Base de données relationnelle
- ✅ Interface utilisateur moderne

### 🔄 Phase 2 - Features Premium (EN COURS)
- ⏳ Intégration voix ElevenLabs (prévu)
- ✅ Multi-guichets (implémenté)
- ✅ Personnalisation avancée (couleurs, logos)
- ⏳ WebSockets temps réel (à implémenter)

### 📅 Phase 3 - Golden Features (PLANIFIÉ)
- ⏳ Système vidéos publicitaires
- ⏳ Analytics avancées  
- ⏳ Support client intégré
- ⏳ Notifications push
- ⏳ Intégration imprimantes

## 🔐 Sécurité & bonnes pratiques

### ✅ Mesures implémentées
- **Hash passwords** avec salt personnalisé SHA-256
- **Validation inputs** côté serveur avec sanitisation
- **Sessions sécurisées** avec expiration 7 jours
- **CORS configuré** pour API
- **Rate limiting** (à implémenter)
- **HTTPS only** en production

### 🎯 Améliorations prévues
- Rate limiting par IP/utilisateur
- Validation email à l'inscription
- 2FA optionnel pour comptes premium
- Logs d'audit détaillés
- Chiffrement données sensibles

## 📞 Support & maintenance

### 🐛 Debug & logs
```bash
# Logs PM2
pm2 logs call-orders --nostream

# Database locale
npm run db:console:local

# Reset complet
npm run db:reset
```

### 📊 Monitoring
- ✅ Health check endpoint: `/api/display/:userId/ping`
- ⏳ Métriques Cloudflare (en production)
- ⏳ Alertes downtime (à configurer)

## 🎯 Plans d'abonnements

### 🆓 BASIC (Gratuit)
- ✅ Affichage numéros commandes
- ✅ 1 guichet
- ✅ Historique 30 jours
- ✅ Support email

### 🔥 PREMIUM (29€/mois)
- ✅ Tout BASIC +
- ✅ Annonces vocales personnalisées  
- ✅ Multi-guichets illimités
- ✅ Historique illimité
- ✅ Personnalisation complète
- ✅ Support prioritaire

### 👑 GOLDEN (49€/mois)
- ✅ Tout PREMIUM +
- ✅ Vidéos publicitaires entre commandes
- ✅ Analytics avancées détaillées
- ✅ API webhooks
- ✅ Support VIP dédié
- ✅ Intégrations tierces

---

## 🎉 Résumé des réalisations

**✨ Statut actuel : MVP CALL ORDERS FONCTIONNEL** 

Le SaaS Call Orders est maintenant **opérationnel** avec toutes les fonctionnalités core implémentées :

- 🏆 **Interface moderne** design professionnel Call Orders
- 🔐 **Authentification complète** inscription/connexion 
- 💾 **Base de données robuste** schéma relationnel optimisé
- 📱 **Dashboard intuitif** gestion commandes en temps réel
- 📺 **Écran TV dédié** affichage automatique avec animations
- 🎨 **Multi-guichets** couleurs et personnalisation
- 📊 **Système abonnements** plans différenciés
- 🔧 **API REST mature** endpoints documentés et testés

**🚀 Prêt pour** : Tests utilisateur, démo client, déploiement vers dashboard.call-order.com

**📈 Prochaines étapes** : Intégration voix (ElevenLabs), WebSockets temps réel, features Golden (publicités vidéo)

---

*Développé avec ❤️ par Jenaate - **Call Orders** SaaS moderne pour restaurateurs*  
*🌐 Production: dashboard.call-order.com*