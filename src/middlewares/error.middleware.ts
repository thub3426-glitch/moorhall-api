import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errors?: unknown[];
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: req.requestId,
  });

  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
  } else if (err.name === 'PrismaClientInitializationError') {
    statusCode = 503;
    message = 'Database service unavailable';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  const response =
    statusCode >= 500
      ? apiResponse.internal(message)
      : statusCode === 404
        ? apiResponse.notFound(message)
        : statusCode === 401
          ? apiResponse.unauthorized(message)
          : statusCode === 403
            ? apiResponse.forbidden(message)
            : apiResponse.badRequest(message, errors);

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json(apiResponse.notFound(`Route ${req.originalUrl} not found`));
};