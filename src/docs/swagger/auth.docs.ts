const registerAdmin = {
  tags: ['Authentication'],
  summary: 'Register a new admin',
  description: 'Create a new admin account for Moor Hall restaurant.',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['fullName', 'email', 'password'],
          properties: {
            fullName: {
              type: 'string',
              minLength: 2,
              example: 'Mugisha Jean',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@moorhall.rw',
            },
            phoneNumber: {
              type: 'string',
              example: '+250788123456',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'password123',
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Admin created successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Registration successful',
            data: {
              admin: {
                id: 1,
                fullName: 'Mugisha Jean',
                email: 'admin@moorhall.rw',
                role: 'ADMIN',
                status: 'ACTIVE',
              },
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    409: {
      description: 'Email already registered',
    },
  },
};

const loginAdmin = {
  tags: ['Authentication'],
  summary: 'Admin login',
  description: 'Authenticate an admin and receive access and refresh tokens',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@moorhall.rw',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Login successful',
            data: {
              admin: {
                id: 1,
                fullName: 'Mugisha Jean',
                email: 'admin@moorhall.rw',
                role: 'ADMIN',
                status: 'ACTIVE',
                lastLoginAt: '2026-04-14T10:30:00Z',
              },
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
    401: {
      description: 'Invalid credentials',
    },
    403: {
      description: 'Account suspended',
    },
  },
};

const refreshToken = {
  tags: ['Authentication'],
  summary: 'Refresh access token',
  description: 'Use refresh token to get new access token',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token refreshed successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Token refreshed successfully',
            data: {
              accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
    401: {
      description: 'Invalid or expired refresh token',
    },
  },
};

const logout = {
  tags: ['Authentication'],
  summary: 'Admin logout',
  description: 'Logout and clear authentication cookies',
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: 'Logged out successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Logged out successfully',
            data: null,
          },
        },
      },
    },
    401: {
      description: 'Not authenticated',
    },
  },
};

const getCurrentAdmin = {
  tags: ['Authentication'],
  summary: 'Get current admin',
  description: 'Get the currently authenticated admin profile',
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: 'Admin retrieved successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Admin retrieved successfully',
            data: {
              id: 1,
              fullName: 'Mugisha Jean',
              email: 'admin@moorhall.rw',
              phoneNumber: '+250788123456',
              role: 'ADMIN',
              status: 'ACTIVE',
              lastLoginAt: '2026-04-14T10:30:00Z',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-04-14T10:30:00Z',
            },
          },
        },
      },
    },
    401: {
      description: 'Not authenticated',
    },
  },
};

const changePassword = {
  tags: ['Authentication'],
  summary: 'Change password',
  description: 'Change the current admin password',
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['currentPassword', 'newPassword', 'confirmPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              example: 'oldpassword123',
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              example: 'newpassword123',
            },
            confirmPassword: {
              type: 'string',
              example: 'newpassword123',
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password changed successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Password changed successfully',
            data: null,
          },
        },
      },
    },
    400: {
      description: 'Validation error or current password incorrect',
    },
    401: {
      description: 'Not authenticated',
    },
  },
};

const updateProfile = {
  tags: ['Authentication'],
  summary: 'Update profile',
  description: 'Update the current admin profile',
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            fullName: {
              type: 'string',
              minLength: 2,
              example: 'Mugisha Jean Updated',
            },
            phoneNumber: {
              type: 'string',
              example: '+250788123456',
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Profile updated successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Profile updated successfully',
            data: {
              id: 1,
              fullName: 'Mugisha Jean Updated',
              email: 'admin@moorhall.rw',
              phoneNumber: '+250788123456',
              role: 'ADMIN',
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    401: {
      description: 'Not authenticated',
    },
  },
};

const forgotPassword = {
  tags: ['Authentication'],
  summary: 'Forgot password',
  description: 'Request password reset instructions',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@moorhall.rw',
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset instructions sent',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Password reset instructions sent to email',
            data: null,
          },
        },
      },
    },
    400: {
      description: 'Validation error',
    },
  },
};

const resetPassword = {
  tags: ['Authentication'],
  summary: 'Reset password',
  description: 'Reset password using reset token',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['resetToken', 'newPassword', 'confirmPassword'],
          properties: {
            resetToken: {
              type: 'string',
              example: 'abc123def456...',
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              example: 'newpassword123',
            },
            confirmPassword: {
              type: 'string',
              example: 'newpassword123',
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Password reset successfully',
            data: null,
          },
        },
      },
    },
    400: {
      description: 'Invalid or expired reset token',
    },
  },
};

const suspendAdmin = {
  tags: ['Authentication'],
  summary: 'Suspend admin',
  description: 'Suspend an admin account (Admin only)',
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'integer',
      },
      example: 2,
    },
  ],
  responses: {
    200: {
      description: 'Admin suspended successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Admin suspended successfully',
            data: {
              id: 2,
              fullName: 'John Doe',
              email: 'john@moorhall.rw',
              role: 'ADMIN',
              status: 'SUSPENDED',
            },
          },
        },
      },
    },
    400: {
      description: 'Cannot suspend yourself',
    },
    401: {
      description: 'Not authenticated',
    },
    403: {
      description: 'Admin access required',
    },
  },
};

const activateAdmin = {
  tags: ['Authentication'],
  summary: 'Activate admin',
  description: 'Activate a suspended admin account (Admin only)',
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'integer',
      },
      example: 2,
    },
  ],
  responses: {
    200: {
      description: 'Admin activated successfully',
      content: {
        'application/json': {
          example: {
            success: true,
            message: 'Admin activated successfully',
            data: {
              id: 2,
              fullName: 'John Doe',
              email: 'john@moorhall.rw',
              role: 'ADMIN',
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    401: {
      description: 'Not authenticated',
    },
    403: {
      description: 'Admin access required',
    },
  },
};

export default {
  registerAdmin,
  loginAdmin,
  refreshToken,
  logout,
  getCurrentAdmin,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
  suspendAdmin,
  activateAdmin,
};
