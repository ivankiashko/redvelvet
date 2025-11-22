const { verifyAccessToken } = require('../utils/auth');

/**
 * SECURITY: Middleware для проверки JWT токена
 * Извлекает токен из Authorization header и верифицирует его
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Извлекаем токен из заголовка Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Верифицируем токен
    const decoded = verifyAccessToken(token);

    // Добавляем данные пользователя в request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token'
      });
    }

    return res.status(403).json({
      error: 'Invalid token',
      message: error.message
    });
  }
};

/**
 * SECURITY: Middleware для проверки роли пользователя
 * Используется после authenticateToken
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * SECURITY: Middleware для проверки владения ресурсом
 * Проверяет, что пользователь имеет доступ только к своим данным
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    // Админы могут получить доступ к любым ресурсам
    if (req.user.userType === 'admin') {
      return next();
    }

    // Проверяем, что пользователь владеет ресурсом
    if (parseInt(resourceUserId) !== req.user.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership
};
