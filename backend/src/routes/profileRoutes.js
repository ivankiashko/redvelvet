const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { validateProfile, handleValidationErrors } = require('../validators/authValidator');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * SECURITY FEATURES:
 * - JWT authentication для защищенных маршрутов
 * - Валидация входных данных
 * - Role-based access control
 */

// @route   GET /api/profiles
// @desc    Получение всех профилей с фильтрацией
// @access  Public
router.get(
  '/',
  profileController.getProfiles
);

// @route   GET /api/profiles/:id
// @desc    Получение профиля по ID
// @access  Public
router.get(
  '/:id',
  profileController.getProfileById
);

// @route   POST /api/profiles
// @desc    Создание нового профиля модели
// @access  Private (только модели)
router.post(
  '/',
  authenticateToken,
  requireRole('model'),
  validateProfile,
  handleValidationErrors,
  profileController.createProfile
);

// @route   PUT /api/profiles/:id
// @desc    Обновление профиля
// @access  Private (владелец или админ)
router.put(
  '/:id',
  authenticateToken,
  validateProfile,
  handleValidationErrors,
  profileController.updateProfile
);

// @route   DELETE /api/profiles/:id
// @desc    Удаление профиля
// @access  Private (владелец или админ)
router.delete(
  '/:id',
  authenticateToken,
  profileController.deleteProfile
);

module.exports = router;
