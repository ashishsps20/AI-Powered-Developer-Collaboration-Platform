import { ApiError } from '../utils/ApiError.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'Route not found'));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message =
    err.isOperational || !isProduction
      ? err.message || 'Internal server error'
      : 'Internal server error';

  if (!isProduction && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
