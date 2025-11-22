const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../validators/authValidator');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

/**
 * SECURITY FEATURES:
 * - Rate limiting на auth endpoints
 * - Валидация входных данных
 * - JWT authentication
 */

// @route   POST /api/auth/register
// @desc    Регистрация нового пользователя
// @access  Public
router.post(
  '/register',
  authLimiter,
  validateRegister,
  handleValidationErrors,
  authController.register
);

// @route   POST /api/auth/login
// @desc    Вход пользователя
// @access  Public
router.post(
  '/login',
  authLimiter,
  validateLogin,
  handleValidationErrors,
  authController.login
);

// @route   POST /api/auth/refresh
// @desc    Обновление access token
// @access  Public
router.post(
  '/refresh',
  authController.refresh
);

// @route   POST /api/auth/logout
// @desc    Выход пользователя
// @access  Private
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

// @route   GET /api/auth/me
// @desc    Получение текущего пользователя
// @access  Private
router.get(
  '/me',
  authenticateToken,
  authController.getCurrentUser
);

module.exports = router;
