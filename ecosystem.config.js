// PM2 Ecosystem — PantauNegeri
// Ref: https://pm2.keymetrics.io/docs/usage/application-declaration/
// All apps run from monorepo root; adjust cwd paths for production deployment.

'use strict';

module.exports = {
  apps: [
    {
      name: 'pantau-frontend',
      cwd: './apps/frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: '/var/log/pm2/pantau-frontend-out.log',
      error_file: '/var/log/pm2/pantau-frontend-err.log',
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'pantau-api',
      cwd: './apps/api',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      out_file: '/var/log/pm2/pantau-api-out.log',
      error_file: '/var/log/pm2/pantau-api-err.log',
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'pantau-worker',
      cwd: './apps/worker',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M', // higher: OCR + PDF can be memory-heavy
      env: {
        NODE_ENV: 'production',
      },
      out_file: '/var/log/pm2/pantau-worker-out.log',
      error_file: '/var/log/pm2/pantau-worker-err.log',
      merge_logs: true,
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
