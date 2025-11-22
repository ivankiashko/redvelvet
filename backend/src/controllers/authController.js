const { query } = require('../config/database');
const { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } = require('../utils/auth');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * SECURITY: Регистрация нового пользователя
 * - Хеширование пароля с bcrypt
 * - Проверка уникальности email
 * - Генерация JWT токенов
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, userType, phone } = req.body;

  // Проверяем, существует ли пользователь
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ApiError(409, 'User already exists', 'An account with this email already exists');
  }

  // Хешируем пароль
  const passwordHash = await hashPassword(password);

  // Создаем пользователя
  const result = await query(
    `INSERT INTO users (email, password_hash, user_type, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, user_type, created_at`,
    [email, passwordHash, userType, phone || null]
  );

  const user = result.rows[0];

  // Генерируем токены
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Сохраняем refresh token в БД
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      createdAt: user.created_at
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

/**
 * SECURITY: Вход пользователя
 * - Проверка пароля с constant-time сравнением
 * - Генерация новых JWT токенов
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Получаем пользователя по email
  const result = await query(
    'SELECT id, email, password_hash, user_type FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new ApiError(401, 'Invalid credentials', 'Email or password is incorrect');
  }

  const user = result.rows[0];

  // Проверяем пароль
  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials', 'Email or password is incorrect');
  }

  // Генерируем токены
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Сохраняем refresh token в БД
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      userType: user.user_type
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

/**
 * SECURITY: Обновление access token с помощью refresh token
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token required');
  }

  // Проверяем наличие токена в БД
  const tokenResult = await query(
    `SELECT rt.*, u.id, u.email, u.user_type
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token = $1 AND rt.expires_at > NOW()`,
    [refreshToken]
  );

  if (tokenResult.rows.length === 0) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = tokenResult.rows[0];

  // Генерируем новый access token
  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    user_type: user.user_type
  });

  res.status(200).json({
    message: 'Token refreshed successfully',
    accessToken: newAccessToken
  });
});

/**
 * SECURITY: Выход пользователя
 * Удаляем refresh token из БД
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Удаляем refresh token из БД
    await query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    );
  }

  res.status(200).json({
    message: 'Logout successful'
  });
});

/**
 * Получение текущего пользователя
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await query(
    'SELECT id, email, user_type, phone, is_verified, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    user: result.rows[0]
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser
};
