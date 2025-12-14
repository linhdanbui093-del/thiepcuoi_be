// PM2 ecosystem file for process management
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'thiep-cuoi-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5003
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 5003
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
}

