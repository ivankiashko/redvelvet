/**
 * SECURITY: Centralized Error Handler
 * Предотвращает утечку sensitive информации в production
 */

// Кастомный класс для API ошибок
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Операционная ошибка (не баг в коде)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Обработчик 404 ошибок
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

// Главный обработчик ошибок
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, details } = err;

  // Устанавливаем статус код по умолчанию
  if (!statusCode) {
    statusCode = 500;
  }

  // В production не показываем stack trace и детали внутренних ошибок
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Логируем ошибку
  if (statusCode >= 500) {
    console.error('❌ Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('⚠️  Client Error:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }

  // Обработка специфичных типов ошибок
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(err.errors).map(e => e.message);
  }

  if (err.code === '23505') { // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
    details = 'A record with this data already exists';
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference';
    details = 'Referenced resource does not exist';
  }

  if (err.code === '22P02') { // PostgreSQL invalid input syntax
    statusCode = 400;
    message = 'Invalid input data';
    details = 'The provided data format is incorrect';
  }

  // Формируем ответ
  const response = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  // Добавляем детали только в development или для операционных ошибок
  if (isDevelopment || err.isOperational) {
    if (details) {
      response.details = details;
    }

    if (isDevelopment && err.stack) {
      response.stack = err.stack;
    }
  } else {
    // В production для внутренних ошибок показываем generic сообщение
    response.error = 'Internal Server Error';
    response.message = 'Something went wrong. Please try again later.';
  }

  res.status(statusCode).json(response);
};

// Обработчик для необработанных Promise rejections
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // В production можно перезапустить приложение
    if (process.env.NODE_ENV === 'production') {
      console.error('🔄 Shutting down gracefully...');
      process.exit(1);
    }
  });
};

// Обработчик для необработанных исключений
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    // Graceful shutdown
    console.error('🔄 Shutting down gracefully...');
    process.exit(1);
  });
};

// Async wrapper для контроллеров
// Автоматически ловит ошибки в async функциях и передает в error handler
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  asyncHandler
};
