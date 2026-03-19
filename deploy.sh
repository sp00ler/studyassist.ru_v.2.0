#!/bin/bash
# ============================================================
# StudyAssist — Deployment Script for Beget VPS (Ubuntu 24.04)
# ============================================================
set -e

APP_DIR="/var/www/studyassist"
REPO_URL="https://github.com/your-org/studyassist.git"
NODE_VERSION="20"

echo "=========================================="
echo "  StudyAssist Deployment Script"
echo "=========================================="

# ─────────────────────────────────────────
# 1. System dependencies
# ─────────────────────────────────────────
echo "📦 Installing system dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx

# ─────────────────────────────────────────
# 2. Node.js 20 via nvm
# ─────────────────────────────────────────
echo "🟢 Installing Node.js ${NODE_VERSION}..."
if ! command -v nvm &> /dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install ${NODE_VERSION}
nvm use ${NODE_VERSION}
nvm alias default ${NODE_VERSION}

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"

# ─────────────────────────────────────────
# 3. MySQL 8
# ─────────────────────────────────────────
echo "🗄️  Installing MySQL 8..."
sudo apt-get install -y mysql-server

# Безопасная настройка MySQL
echo "⚙️  Configuring MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Создаём БД и пользователя (замените пароли!)
sudo mysql -e "
  CREATE DATABASE IF NOT EXISTS studyassist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'studyassist'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
  GRANT ALL PRIVILEGES ON studyassist.* TO 'studyassist'@'localhost';
  FLUSH PRIVILEGES;
"
echo "✅ MySQL configured"

# ─────────────────────────────────────────
# 4. PM2
# ─────────────────────────────────────────
echo "🔄 Installing PM2..."
npm install -g pm2
pm2 startup

# ─────────────────────────────────────────
# 5. App directory
# ─────────────────────────────────────────
echo "📁 Setting up app directory..."
sudo mkdir -p ${APP_DIR}
sudo mkdir -p /var/log/studyassist
sudo chown -R $USER:$USER ${APP_DIR}
sudo chown -R $USER:$USER /var/log/studyassist

# ─────────────────────────────────────────
# 6. Clone / update repo
# ─────────────────────────────────────────
if [ -d "${APP_DIR}/.git" ]; then
  echo "🔄 Updating existing repository..."
  cd ${APP_DIR}
  git pull origin main
else
  echo "📥 Cloning repository..."
  git clone ${REPO_URL} ${APP_DIR}
  cd ${APP_DIR}
fi

# ─────────────────────────────────────────
# 7. Environment variables
# ─────────────────────────────────────────
if [ ! -f "${APP_DIR}/.env" ]; then
  echo "⚙️  Creating .env file from example..."
  cp ${APP_DIR}/.env.example ${APP_DIR}/.env
  echo "⚠️  ВАЖНО: Отредактируйте ${APP_DIR}/.env с реальными значениями!"
  echo "   nano ${APP_DIR}/.env"
fi

# ─────────────────────────────────────────
# 8. Install dependencies
# ─────────────────────────────────────────
echo "📦 Installing npm dependencies..."
cd ${APP_DIR}
npm ci --production=false

# ─────────────────────────────────────────
# 9. Prisma
# ─────────────────────────────────────────
echo "🗃️  Running Prisma migrations..."
npx prisma generate
npx prisma migrate deploy

echo "🌱 Running seed..."
npm run db:seed

# ─────────────────────────────────────────
# 10. Build
# ─────────────────────────────────────────
echo "🔨 Building Next.js application..."
npm run build

# Generate sitemap
npm run postbuild 2>/dev/null || true

# ─────────────────────────────────────────
# 11. Create uploads directory
# ─────────────────────────────────────────
mkdir -p ${APP_DIR}/public/uploads
chmod 755 ${APP_DIR}/public/uploads

# ─────────────────────────────────────────
# 12. Start/restart PM2
# ─────────────────────────────────────────
echo "🚀 Starting application with PM2..."
pm2 delete studyassist 2>/dev/null || true
pm2 start ${APP_DIR}/ecosystem.config.js
pm2 save

echo "✅ PM2 status:"
pm2 status

echo ""
echo "=========================================="
echo "  Next steps:"
echo "=========================================="
echo "1. Edit .env:          nano ${APP_DIR}/.env"
echo "2. Configure Nginx:    sudo nano /etc/nginx/sites-available/studyassist"
echo "3. Enable Nginx:       sudo ln -s /etc/nginx/sites-available/studyassist /etc/nginx/sites-enabled/"
echo "4. Test Nginx:         sudo nginx -t"
echo "5. Reload Nginx:       sudo systemctl reload nginx"
echo "6. Get SSL cert:       sudo certbot --nginx -d studyassist.ru -d www.studyassist.ru"
echo ""
echo "🎉 Deployment completed!"
