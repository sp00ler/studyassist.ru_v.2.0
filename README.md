# StudyAssist — Помощь студентам

Полнофункциональный веб-сервис помощи студентам с учёбой. Курсовые, дипломные, рефераты, лабораторные.

## Технологии

- **Frontend/Backend**: Next.js 14 (App Router), TypeScript
- **Стили**: Tailwind CSS, shadcn/ui, Framer Motion
- **База данных**: MySQL 8 + Prisma ORM
- **Авторизация**: NextAuth.js (VK, Mail.ru, Яндекс, Email/Password)
- **Платежи**: ЮKassa SDK
- **Уведомления**: Nodemailer (SMTP) + Telegram Bot
- **Аналитика**: Яндекс Метрика

## Быстрый старт (локально)

```bash
# 1. Клонировать и установить зависимости
git clone https://github.com/your-org/studyassist.git
cd studyassist
npm install

# 2. Настроить окружение
cp .env.example .env
# Отредактировать .env с вашими значениями

# 3. База данных (должен работать MySQL)
npx prisma migrate dev
npm run db:seed

# 4. Запустить
npm run dev
```

Открыть: http://localhost:3000

## Развёртывание на Beget VPS (Ubuntu 24.04)

### Требования к серверу
- Ubuntu 24.04 LTS
- 1 CPU core, 1 GB RAM (рекомендуется 2 GB)
- 20 GB SSD
- Открытые порты: 80, 443, 3306 (только localhost)

### Автоматическое развёртывание

```bash
# Загрузить скрипт и запустить
git clone https://github.com/your-org/studyassist.git
bash studyassist/deploy.sh
```

### Ручное развёртывание (шаг за шагом)

#### 1. Node.js 20 via nvm
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

#### 2. MySQL 8
```bash
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation

# Создать БД и пользователя
sudo mysql -u root -p
```
```sql
CREATE DATABASE studyassist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'studyassist'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON studyassist.* TO 'studyassist'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. PM2
```bash
npm install -g pm2
pm2 startup
```

#### 4. Клонировать репозиторий
```bash
sudo mkdir -p /var/www/studyassist
sudo chown $USER:$USER /var/www/studyassist
git clone https://github.com/your-org/studyassist.git /var/www/studyassist
cd /var/www/studyassist
```

#### 5. Настроить переменные окружения
```bash
cp .env.example .env
nano .env
```

Заполните все переменные:
```env
DATABASE_URL="mysql://studyassist:YOUR_PASSWORD@localhost:3306/studyassist"
NEXTAUTH_URL="https://studyassist.ru"
NEXTAUTH_SECRET="ваш-секрет-32-символа"
# ... остальные переменные
```

Генерация секрета NextAuth:
```bash
openssl rand -base64 32
```

#### 6. Установить зависимости и собрать
```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
```

#### 7. Запустить через PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

#### 8. Nginx
```bash
sudo apt-get install -y nginx
sudo cp nginx.conf /etc/nginx/sites-available/studyassist
sudo ln -s /etc/nginx/sites-available/studyassist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 9. SSL через Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d studyassist.ru -d www.studyassist.ru
```

## Настройка переменных окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `NEXTAUTH_URL` | URL сайта (https://studyassist.ru) |
| `NEXTAUTH_SECRET` | Секрет NextAuth (генерируется через openssl) |
| `VK_CLIENT_ID` | ID приложения VK |
| `VK_CLIENT_SECRET` | Secret приложения VK |
| `MAILRU_CLIENT_ID` | ID приложения Mail.ru |
| `MAILRU_CLIENT_SECRET` | Secret Mail.ru |
| `YANDEX_CLIENT_ID` | ID OAuth приложения Яндекс |
| `YANDEX_CLIENT_SECRET` | Secret Яндекс |
| `TELEGRAM_BOT_TOKEN` | Токен бота Telegram |
| `TELEGRAM_CHAT_ID` | ID чата для уведомлений |
| `SUPPORT_CHAT_ID` | (Опционально) ID отдельной группы для онлайн-чата поддержки |
| `SMTP_HOST` | SMTP сервер (smtp.beget.com) |
| `SMTP_PORT` | SMTP порт (465) |
| `SMTP_USER` | Email для отправки |
| `SMTP_PASS` | Пароль SMTP |
| `YUKASSA_SHOP_ID` | ID магазина ЮKassa |
| `YUKASSA_SECRET_KEY` | Секретный ключ ЮKassa |
| `YUKASSA_RETURN_URL` | URL после оплаты |
| `ADMIN_SECRET` | Пароль fallback для /admin |
| `NEXT_PUBLIC_METRIKA_ID` | ID счётчика Яндекс Метрики |

## Настройка OAuth провайдеров

### ВКонтакте
1. Перейти на https://vk.com/apps?act=manage
2. Создать приложение типа "Web-сайт"
3. Redirect URI: `https://studyassist.ru/api/auth/callback/vk`

### Mail.ru
1. Перейти на https://o2.mail.ru/app/
2. Создать приложение
3. Redirect URI: `https://studyassist.ru/api/auth/callback/mailru`

### Яндекс
1. Перейти на https://oauth.yandex.ru/client/new
2. Создать приложение
3. Redirect URI: `https://studyassist.ru/api/auth/callback/yandex`

## Telegram бот

1. Создать бота через @BotFather
2. Получить токен → `TELEGRAM_BOT_TOKEN`
3. Создать группу для уведомлений, добавить бота
4. Получить ID группы → `TELEGRAM_CHAT_ID`
5. Установить webhook:
```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://studyassist.ru/api/telegram/webhook"}'
```

## YuKassa

1. Зарегистрироваться на https://yookassa.ru/
2. Создать магазин
3. Получить `shopId` и `secretKey`
4. Настроить webhook: `https://studyassist.ru/api/payments/webhook`

## Первичный доступ

После seed:
- Admin: `admin@studyassist.ru` / `admin123!`
- Test user: `anna@test.ru` / `test123`

**Сменить пароли после первого входа!**

## Структура проекта

```
studyassist/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout + Metrika
│   ├── page.tsx            # Home page
│   ├── auth/               # Login + Register
│   ├── dashboard/          # Student cabinet
│   ├── admin/              # Admin panel
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navbar, Footer
│   ├── home/               # Home page sections
│   ├── dashboard/          # Dashboard components
│   └── admin/              # Admin components
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # NextAuth config
│   ├── email.ts            # Nodemailer
│   ├── telegram.ts         # Telegram bot
│   ├── yukassa.ts          # YuKassa
│   └── utils.ts            # Helpers
├── prisma/
│   ├── schema.prisma       # DB schema
│   └── seed.ts             # Seed data
├── public/uploads/         # File uploads
├── deploy.sh               # Deployment script
├── ecosystem.config.js     # PM2 config
└── nginx.conf              # Nginx config
```

## Мониторинг и обслуживание

```bash
# Статус приложения
pm2 status
pm2 logs studyassist

# Перезапуск
pm2 restart studyassist

# Обновление (после git pull)
cd /var/www/studyassist
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart studyassist

# Логи Nginx
sudo tail -f /var/log/nginx/studyassist.error.log
```

## Частые проблемы

**Ошибка подключения к БД**: Проверьте `DATABASE_URL` в `.env`

**OAuth не работает**: Проверьте Redirect URI в настройках приложения

**Файлы не загружаются**: Проверьте права на `/var/www/studyassist/public/uploads/`

**PM2 не стартует**: Проверьте `pm2 logs studyassist --err`

### Диагностика: сообщения онлайн-чата не приходят в Telegram

1. Проверить, что процесс запущен и читает актуальный `.env`:
```bash
cd /var/www/studyassist
pm2 status
pm2 env studyassist | rg "TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|SUPPORT_CHAT_ID"
```

2. Смотреть серверные логи приложения в реальном времени:
```bash
pm2 logs studyassist --lines 200
pm2 logs studyassist --err --lines 200
```

3. Если в `ecosystem.config.js` настроены файловые логи, смотреть их:
```bash
tail -f /var/log/studyassist/combined.log
tail -f /var/log/studyassist/error.log
```

4. Проверить webhook Telegram:
```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

5. Проверить, может ли бот писать в нужную группу:
```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"-100XXXXXXXXXX","text":"test from server"}'
```

6. `SUPPORT_CHAT_ID` можно указывать без кавычек:
```env
SUPPORT_CHAT_ID=-1001234567890
```
или в кавычках — тоже допустимо:
```env
SUPPORT_CHAT_ID="-1001234567890"
```
После изменения `.env` перезапустите процесс:
```bash
pm2 restart studyassist --update-env
```

---

© 2025 StudyAssist.ru
