const { pool } = require('./database');

// SQL миграции для создания таблиц БД
const migrations = `
-- Создание enum типов
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('client', 'model', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE profile_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_plan AS ENUM ('basic', 'premium', 'vip');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  user_type user_type NOT NULL DEFAULT 'client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  -- Индексы для быстрого поиска
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Таблица кошельков
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_type VARCHAR(50) NOT NULL,
  wallet_network VARCHAR(50) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Защита от дубликатов
  UNIQUE(user_id)
);

-- Таблица профилей моделей
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  city VARCHAR(50) NOT NULL,
  height INTEGER CHECK (height > 0 AND height < 300),
  weight INTEGER CHECK (weight > 0 AND weight < 300),
  bust_size VARCHAR(10),
  eye_color VARCHAR(50),
  hair_color VARCHAR(50),
  nationality VARCHAR(50),
  body_type VARCHAR(50),
  clothing_size VARCHAR(10),
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  services TEXT[], -- Массив услуг
  phone VARCHAR(20),
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  status profile_status DEFAULT 'pending',
  payment_plan payment_plan,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Только одна анкета на пользователя
  UNIQUE(user_id)
);

-- Таблица изображений профилей
CREATE TABLE IF NOT EXISTS profile_images (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Один пользователь - один отзыв на анкету
  UNIQUE(profile_id, user_id)
);

-- Таблица избранного
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Защита от дубликатов
  UNIQUE(user_id, profile_id)
);

-- Таблица refresh токенов для JWT
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Индекс для быстрого поиска
  UNIQUE(token)
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического пересчета рейтинга профиля
CREATE OR REPLACE FUNCTION recalculate_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE profile_id = NEW.profile_id
    ),
    review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE profile_id = NEW.profile_id
    )
    WHERE id = NEW.profile_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического пересчета рейтинга
DROP TRIGGER IF EXISTS recalculate_rating_on_review ON reviews;
CREATE TRIGGER recalculate_rating_on_review AFTER INSERT OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION recalculate_profile_rating();

-- Успешное завершение миграции
SELECT 'Migrations completed successfully!' as message;
`;

// Запуск миграций
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    await pool.query(migrations);
    console.log('✓ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

// Запуск если файл вызван напрямую
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
