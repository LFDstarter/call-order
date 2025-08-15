// Configuration PM2 pour Call Orders SaaS
// Gestion des processus pour le développement et la production

module.exports = {
  apps: [
    {
      name: 'call-orders',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=call-orders-production --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        // Variables d'environnement pour le développement local
        DB_LOCAL: 'true',
        APP_NAME: 'Call Orders',
        APP_VERSION: '1.0.0'
      },
      // Options PM2
      instances: 1,
      exec_mode: 'fork',
      watch: false, // Wrangler gère déjà le hot reload
      max_memory_restart: '500M',
      
      // Logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart policy
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      
      // Ignore these files for potential watch mode
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '.wrangler',
        'dist'
      ]
    }
  ],

  // Configuration pour le déploiement (non utilisée actuellement mais prête)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/call-orders.git',
      path: '/var/www/call-orders',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};