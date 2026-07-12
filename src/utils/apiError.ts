/**
 * Custom API Error class for handling HTTP errors
 */

// Extend ErrorConstructor interface for V8's captureStackTrace
declare global {
  interface ErrorConstructor {
    captureStackTrace(errorInstance: Error, constructorOpt?: Function): void;
  }
}

class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: unknown[];

  constructor(
    statusCode: number,
    message: string,
    errors?: unknown[],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    this.name = this.constructor.name;

    Object.setPrototypeOf(this, new.target.prototype);
    // V8-specific: capture stack trace (only available in V8 environments like Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Bad Request (400)
   */
  static badRequest(message: string, errors?: unknown[]) {
    return new ApiError(400, message, errors);
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Forbidden (403)
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Not Found (404)
   */
  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  /**
   * Conflict (409)
   */
  static conflict(message: string) {
    return new ApiError(409, message);
  }

  /**
   * Too Many Requests (429)
   */
  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  /**
   * Internal Server Error (500)
   */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message, undefined, false);
  }
}

export default ApiError;