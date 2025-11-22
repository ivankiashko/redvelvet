const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

/**
 * SECURITY: Валидация для регистрации
 * Защита от XSS, injection и некорректных данных
 */
const validateRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters')
    .customSanitizer(value => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('userType')
    .isIn(['client', 'model'])
    .withMessage('User type must be either client or model'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
    .customSanitizer(value => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }))
];

/**
 * SECURITY: Валидация для входа
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .customSanitizer(value => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters')
];

/**
 * SECURITY: Валидация для создания/обновления профиля
 */
const validateProfile = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Zа-яА-ЯёЁ\s-]+$/)
    .withMessage('Name can only contain letters, spaces and hyphens')
    .customSanitizer(value => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })),

  body('age')
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),

  body('city')
    .trim()
    .isIn(['moscow', 'spb', 'krasnodar', 'sochi', 'ekaterinburg', 'kazan'])
    .withMessage('Invalid city'),

  body('height')
    .isInt({ min: 140, max: 220 })
    .withMessage('Height must be between 140 and 220 cm'),

  body('weight')
    .isInt({ min: 40, max: 150 })
    .withMessage('Weight must be between 40 and 150 kg'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .customSanitizer(value => sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {}
    })),

  body('price')
    .isInt({ min: 1000, max: 1000000 })
    .withMessage('Price must be between 1000 and 1000000'),

  body('services')
    .isArray({ min: 1, max: 39 })
    .withMessage('Services must be an array with 1 to 39 items')
    .custom((services) => {
      // Проверяем каждую услугу
      return services.every(service =>
        typeof service === 'string' &&
        service.length > 0 &&
        service.length <= 100
      );
    })
    .withMessage('Each service must be a non-empty string with max 100 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
];

/**
 * SECURITY: Валидация для отзывов
 */
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('reviewText')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Review text must be between 10 and 500 characters')
    .customSanitizer(value => sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {}
    })),

  body('profileId')
    .isInt({ min: 1 })
    .withMessage('Invalid profile ID')
];

/**
 * SECURITY: Валидация для кошелька
 */
const validateWallet = [
  body('walletType')
    .trim()
    .isIn(['BTC', 'ETH', 'USDT', 'TON'])
    .withMessage('Invalid wallet type'),

  body('walletNetwork')
    .trim()
    .isIn(['Bitcoin', 'Ethereum', 'TRC20', 'ERC20', 'TON'])
    .withMessage('Invalid wallet network'),

  body('walletAddress')
    .trim()
    .isLength({ min: 26, max: 100 })
    .withMessage('Invalid wallet address length')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Wallet address can only contain alphanumeric characters')
];

/**
 * SECURITY: Middleware для проверки результатов валидации
 * Возвращает подробные ошибки валидации клиенту
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfile,
  validateReview,
  validateWallet,
  handleValidationErrors
};
