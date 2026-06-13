module.exports = {
  apps: [
    {
      name: 'studyassist',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/studyassist',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '900M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
      error_file: '/var/log/studyassist/error.log',
      out_file: '/var/log/studyassist/out.log',
      log_file: '/var/log/studyassist/combined.log',
      time: true,
    },
  ],
}
