interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: { [key: string]: unknown };
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: unknown[];
}

const apiResponse = {
  success<T>(
    data?: T,
    message = 'Success',
    meta?: ApiResponse['meta']
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      ...(meta && { meta }),
    };
  },

  created<T>(data: T, message = 'Created successfully'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  },

  updated<T>(data: T, message = 'Updated successfully'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  },

  deleted(message = 'Deleted successfully'): ApiResponse {
    return {
      success: true,
      message,
    };
  },

  noContent(message = 'No content'): ApiResponse {
    return {
      success: true,
      message,
    };
  },

  badRequest(message: string, errors?: unknown[]): ErrorResponse {
    return {
      success: false,
      message,
      ...(errors && { errors }),
    };
  },

  unauthorized(message = 'Unauthorized'): ErrorResponse {
    return {
      success: false,
      message,
    };
  },

  forbidden(message = 'Forbidden'): ErrorResponse {
    return {
      success: false,
      message,
    };
  },

  notFound(message = 'Not found'): ErrorResponse {
    return {
      success: false,
      message,
    };
  },

  internal(message = 'Internal server error'): ErrorResponse {
    return {
      success: false,
      message,
    };
  },
};

export default apiResponse;