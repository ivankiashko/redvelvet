const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

/**
 * SECURITY: Helmet для установки security headers
 * Защита от XSS, clickjacking, MIME sniffing и других атак
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 год
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: {
    action: 'deny'
  }
});

/**
 * SECURITY: Rate limiting для защиты от brute force и DDoS
 * Ограничиваем количество запросов с одного IP
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Максимум 100 запросов
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Пропускаем успешные запросы для более мягкого лимита
  skipSuccessfulRequests: false,
  // Обработчик при превышении лимита
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * SECURITY: Строгий rate limiting для аутентификации
 * Защита от brute force атак на пароли
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // Максимум 5 попыток входа
  message: {
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считаем успешные попытки
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Your account has been temporarily locked. Please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * SECURITY: CORS настройки
 * Ограничиваем доступ только с разрешенных доменов
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 часа
};

/**
 * SECURITY: Middleware для логирования подозрительных запросов
 */
const logSuspiciousActivity = (req, res, next) => {
  // Проверяем на SQL injection паттерны
  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /exec(\s|\+)+(s|x)p\w+/i,
  ];

  // Проверяем на XSS паттерны
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  const checkPatterns = (value, patterns) => {
    if (typeof value === 'string') {
      return patterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  // Проверяем query параметры
  const queryString = JSON.stringify(req.query);
  const bodyString = JSON.stringify(req.body);

  const isSuspicious =
    sqlInjectionPatterns.some(pattern => pattern.test(queryString) || pattern.test(bodyString)) ||
    xssPatterns.some(pattern => pattern.test(queryString) || pattern.test(bodyString));

  if (isSuspicious) {
    console.warn('⚠️  Suspicious activity detected:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid request parameters detected'
    });
  }

  next();
};

/**
 * SECURITY: Middleware для защиты от parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
  // Удаляем дубликаты параметров в query
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][0];
      }
    });
  }
  next();
};

module.exports = {
  securityHeaders,
  generalLimiter,
  authLimiter,
  corsOptions,
  corsMiddleware: cors(corsOptions),
  logSuspiciousActivity,
  preventParameterPollution
};
