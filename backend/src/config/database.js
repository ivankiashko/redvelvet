const { Pool } = require('pg');
require('dotenv').config();

// Создаем pool соединений с PostgreSQL
// SECURITY: Используем параметризованные запросы для защиты от SQL injection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'redvelvet',
  user: process.env.DB_USER || 'redvelvet_user',
  password: process.env.DB_PASSWORD,
  // Настройки безопасности и производительности
  max: 20, // Максимальное количество клиентов в пуле
  idleTimeoutMillis: 30000, // Закрывать неактивные соединения через 30 сек
  connectionTimeoutMillis: 2000, // Таймаут подключения 2 сек
  // SSL для production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

// Обработка ошибок пула
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Функция для выполнения запросов с автоматическим управлением транзакциями
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Логируем запросы в development
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Функция для выполнения транзакций
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Проверка подключения к БД
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
