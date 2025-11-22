# Инструкция по деплою RedVelvet Backend

## 🚀 Быстрый старт (Development)

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка PostgreSQL

#### Опция A: Локальная установка

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Создание БД и пользователя
sudo -u postgres psql
```

В PostgreSQL консоли:
```sql
CREATE DATABASE redvelvet;
CREATE USER redvelvet_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE redvelvet TO redvelvet_user;
\q
```

#### Опция B: Docker

```bash
# Запуск PostgreSQL в Docker
docker run --name redvelvet-postgres \
  -e POSTGRES_DB=redvelvet \
  -e POSTGRES_USER=redvelvet_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Настройка environment variables

```bash
# Копируем пример
cp .env.example .env

# Редактируем .env
nano .env
```

Пример `.env`:
```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=redvelvet
DB_USER=redvelvet_user
DB_PASSWORD=your_password

# ВАЖНО: Генерируйте надежные ключи!
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-long-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

CORS_ORIGIN=http://localhost:8080

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Запуск миграций

```bash
npm run migrate
```

### 5. Запуск сервера

```bash
# Development (с hot reload)
npm run dev

# Production
npm start
```

Сервер запустится на http://localhost:3000

---

## 🔒 Production Deployment

### Подготовка к production

#### 1. Генерация секретных ключей

```bash
# Linux/macOS
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Или используйте openssl
openssl rand -hex 32
```

#### 2. Обновление .env для production

```env
NODE_ENV=production
PORT=3000

# Production БД (используйте managed PostgreSQL)
DB_HOST=your-db-host.example.com
DB_PORT=5432
DB_NAME=redvelvet_production
DB_USER=redvelvet_prod
DB_PASSWORD=super-secure-password-here

# Сгенерированные ключи
JWT_SECRET=<ваш-сгенерированный-ключ>
JWT_REFRESH_SECRET=<ваш-другой-сгенерированный-ключ>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

# Production домен
CORS_ORIGIN=https://yourwebsite.com

# Более строгие лимиты
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

### Деплой на VPS (Ubuntu/Debian)

#### 1. Установка Node.js

```bash
# NodeSource repo
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка
node --version
npm --version
```

#### 2. Установка PostgreSQL

```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание БД
sudo -u postgres psql -c "CREATE DATABASE redvelvet_production;"
sudo -u postgres psql -c "CREATE USER redvelvet_prod WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE redvelvet_production TO redvelvet_prod;"
```

#### 3. Клонирование проекта

```bash
cd /var/www
git clone https://github.com/ivankiashko/redvelvet.git
cd redvelvet/backend
npm install --production
```

#### 4. Настройка environment

```bash
nano .env
# Вставьте production конфигурацию
```

#### 5. Запуск миграций

```bash
npm run migrate
```

#### 6. Настройка PM2 (Process Manager)

```bash
# Установка PM2
sudo npm install -g pm2

# Запуск приложения
pm2 start src/server.js --name redvelvet-backend

# Настройка автозапуска
pm2 startup
pm2 save

# Проверка статуса
pm2 status
pm2 logs redvelvet-backend
```

#### 7. Настройка Nginx (Reverse Proxy)

```bash
sudo apt-get install nginx

# Создание конфига
sudo nano /etc/nginx/sites-available/redvelvet
```

Конфигурация Nginx:
```nginx
server {
    listen 80;
    server_name api.yourwebsite.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация конфига
sudo ln -s /etc/nginx/sites-available/redvelvet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt-get install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d api.yourwebsite.com

# Автообновление сертификата
sudo certbot renew --dry-run
```

---

## 🐳 Docker Deployment

### 1. Создание Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Expose порт
EXPOSE 3000

# Запуск
CMD ["node", "src/server.js"]
```

### 2. Создание docker-compose.yml

```yaml
# backend/docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: redvelvet
      POSTGRES_USER: redvelvet_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: redvelvet
      DB_USER: redvelvet_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - db
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. Запуск с Docker

```bash
# Сборка и запуск
docker-compose up -d

# Запуск миграций
docker-compose exec backend npm run migrate

# Просмотр логов
docker-compose logs -f backend

# Остановка
docker-compose down
```

---

## ☁️ Cloud Deployment

### Heroku

```bash
# Установка Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Логин
heroku login

# Создание приложения
heroku create redvelvet-backend

# Добавление PostgreSQL
heroku addons:create heroku-postgresql:mini

# Установка environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret
heroku config:set CORS_ORIGIN=https://yourwebsite.com

# Деплой
git push heroku main

# Запуск миграций
heroku run npm run migrate

# Просмотр логов
heroku logs --tail
```

### DigitalOcean App Platform

1. Подключите GitHub репозиторий
2. Выберите `backend` директорию
3. Добавьте PostgreSQL managed database
4. Настройте environment variables
5. Deploy

### AWS (EC2 + RDS)

1. Запустите EC2 instance (Ubuntu)
2. Создайте RDS PostgreSQL instance
3. Настройте Security Groups
4. Следуйте инструкциям VPS deployment выше
5. Используйте RDS endpoint для DB_HOST

---

## 📊 Мониторинг

### PM2 Monitoring

```bash
# Мониторинг в реальном времени
pm2 monit

# Статус процессов
pm2 status

# Логи
pm2 logs redvelvet-backend --lines 100
```

### Health Check

```bash
# Простая проверка
curl http://localhost:3000/health

# С jq для красивого вывода
curl -s http://localhost:3000/health | jq
```

### Автоматический мониторинг (UptimeRobot, Pingdom)

Настройте мониторинг endpoint'а:
```
https://api.yourwebsite.com/health
```

---

## 🔧 Обслуживание

### Backup базы данных

```bash
# Создание backup
pg_dump -U redvelvet_user -h localhost redvelvet > backup_$(date +%Y%m%d).sql

# Восстановление
psql -U redvelvet_user -h localhost redvelvet < backup_20250122.sql

# Автоматический backup (cron)
# Добавьте в crontab:
0 2 * * * pg_dump -U redvelvet_user redvelvet > /backups/db_$(date +\%Y\%m\%d).sql
```

### Обновление приложения

```bash
# Pull последних изменений
git pull origin main

# Установка новых зависимостей
npm install --production

# Запуск миграций (если есть)
npm run migrate

# Перезапуск PM2
pm2 restart redvelvet-backend
```

### Проверка безопасности

```bash
# Проверка уязвимостей в зависимостях
npm audit

# Исправление уязвимостей
npm audit fix

# Проверка устаревших пакетов
npm outdated
```

---

## 🚨 Troubleshooting

### Проблема: Не могу подключиться к БД

```bash
# Проверка PostgreSQL
sudo systemctl status postgresql

# Проверка соединения
psql -U redvelvet_user -h localhost -d redvelvet

# Проверка pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Добавьте: host all all 0.0.0.0/0 md5

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

### Проблема: JWT ошибки

- Проверьте, что JWT_SECRET установлен
- Проверьте формат токена (должен быть "Bearer <token>")
- Проверьте срок действия токена

### Проблема: CORS ошибки

- Проверьте CORS_ORIGIN в .env
- Убедитесь, что фронтенд использует правильный домен
- Проверьте, что credentials: true на фронтенде

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `pm2 logs redvelvet-backend`
2. Проверьте health endpoint: `/health`
3. Проверьте environment variables
4. Обратитесь к SECURITY_AUDIT.md

---

**Дата обновления:** 2025-11-22
**Версия:** 1.0.0
