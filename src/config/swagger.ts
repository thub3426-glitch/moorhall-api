import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';
import authDocs from '../docs/swagger/auth.docs.js';
import categoryDocs from '../docs/swagger/category.docs.js';
import adminDocs from '../docs/swagger/admin.docs.js';
import activityDocs from '../docs/swagger/activity.docs.js';
import notificationDocs from '../docs/swagger/notification.docs.js';
import orderDocs from '../docs/swagger/orders.docs.js';
import menuItemDocs from '../docs/swagger/menu.docs.js';
import customerDocs from '../docs/swagger/customer.docs.js';

const swaggerOptions: Options = {
  apis: [], // Required by swagger-jsdoc; paths are defined manually in definition.paths
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Moor Hall API',
      version: '1.0.0',
      description: `
# Moor Hall Restaurant API

Moor Hall is a premier restaurant located in Kigali, Rwanda.
This API provides endpoints for managing the restaurant's operations including:

- **Authentication**: Admin login, registration, password management
- **Menu Management**: Categories and menu items
- **Order Management**: Order creation, status updates, payment review
- **Customer Management**: Customer records and order history
- **Admin Dashboard**: Statistics and analytics
- **Notifications**: WhatsApp notification tracking
- **Activity Logs**: System activity tracking

## Authentication

Most endpoints require authentication using JWT Bearer tokens.
Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

- Login: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- Password reset: 3 attempts per hour

## Contact

For API support, contact the development team.
      `,
      contact: {
        name: 'API Support',
        email: 'support@moorhall.rw',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3005}`,
        description: 'Development server',
      },
      {
        url: 'https://moorhallapi-haatnpvg.b4a.run/',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            statusCode: { type: 'number', example: 400 },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success message' },
            data: { type: 'object' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Admin authentication endpoints - login, register, password reset' },
      { name: 'Admin', description: 'Admin dashboard and management endpoints' },
      { name: 'Categories', description: 'Menu category management (protected)' },
      { name: 'Menu Items', description: 'Menu item management (protected)' },
      { name: 'Orders', description: 'Order management - guest orders and admin order handling' },
      { name: 'Customers', description: 'Customer management (protected)' },
      { name: 'Activity', description: 'Activity log and audit trail endpoints (protected)' },
      { name: 'Notifications', description: 'WhatsApp notification tracking and management (protected)' },
      { name: 'Webhooks', description: 'External webhook endpoints for integrations' },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      // Auth endpoints
      '/api/v1/auth/register': {
        post: authDocs.registerAdmin
      },
      '/api/v1/auth/login': {
        post: authDocs.loginAdmin
      },
      '/api/v1/auth/refresh': {
        post: authDocs.refreshToken
      },
      '/api/v1/auth/logout': {
        post: authDocs.logout
      },
      '/api/v1/auth/me': {
        get: authDocs.getCurrentAdmin
      },
      '/api/v1/auth/change-password': {
        patch: authDocs.changePassword
      },
      '/api/v1/auth/profile': {
        patch: authDocs.updateProfile
      },
      '/api/v1/auth/forgot-password': {
        post: authDocs.forgotPassword
      },
      '/api/v1/auth/reset-password': {
        post: authDocs.resetPassword
      },
      '/api/v1/auth/suspend/{id}': {
        patch: authDocs.suspendAdmin
      },
      '/api/v1/auth/activate/{id}': {
        patch: authDocs.activateAdmin
      },

      // Admin endpoints
      '/api/v1/admin/dashboard': {
        get: adminDocs.getDashboard,
      },

      // Category endpoints
      '/api/v1/admin/categories': {
        post: categoryDocs.createCategory,
        get: categoryDocs.getCategories,
      },
      '/api/v1/admin/categories/{id}': {
        get: categoryDocs.getCategoryById,
        patch: categoryDocs.updateCategory,
        delete: categoryDocs.deleteCategory,
      },

      // Menu Item endpoints
      '/api/v1/admin/menu-items': {
        post: menuItemDocs.createMenuItem,
        get: menuItemDocs.getMenuItems,
      },
      '/api/v1/admin/menu-items/{id}': {
        get: menuItemDocs.getMenuItemById,
        patch: menuItemDocs.updateMenuItem,
        delete: menuItemDocs.deleteMenuItem,
      },
      '/api/v1/admin/menu-items/{id}/availability': {
        patch: menuItemDocs.toggleAvailability,
      },

      // Customer endpoints
      '/api/v1/admin/customers': {
        get: customerDocs.getCustomers,
      },
      '/api/v1/admin/customers/phone/{phone}': {
        get: customerDocs.getCustomerByPhone,
      },

      // Activity endpoints
      '/api/v1/admin/activities': {
        get: activityDocs.getActivities,
      },
      '/api/v1/admin/activities/{id}': {
        get: activityDocs.getActivityById,
      },

      // Notification endpoints
      '/api/v1/admin/notifications': {
        get: notificationDocs.getNotifications,
      },
      '/api/v1/admin/notifications/{id}': {
        get: notificationDocs.getNotificationById,
      },
      '/api/v1/admin/notifications/{id}/resend': {
        post: notificationDocs.resendNotification,
      },

      // Order endpoints - Guest orders
      '/api/v1/orders/guest': {
        post: orderDocs.createGuestOrder,
      },

      // Order endpoints - Admin management
      '/api/v1/orders': {
        get: orderDocs.getOrders,
      },
      '/api/v1/orders/{id}': {
        get: orderDocs.getOrderById,
      },
      '/api/v1/orders/{id}/status': {
        patch: orderDocs.updateOrderStatus,
      },
      '/api/v1/orders/{id}/payment-review': {
        patch: orderDocs.reviewPayment,
      },
      '/api/v1/orders/settings/payment': {
        get: orderDocs.getPaymentSettings,
        patch: orderDocs.setPaymentSettings,
      },
      '/api/v1/orders/{id}/whatsapp': {
        post: orderDocs.sendWhatsAppUpdate,
      },
      '/api/v1/orders/{id}/receipt': {
        post: orderDocs.sendReceipt,
      },

      // Webhook endpoints
      '/api/v1/webhooks/whatsapp': {
        get: {
          tags: ['Webhooks'],
          summary: 'Verify WhatsApp webhook',
          parameters: [
            { in: 'query', name: 'hub.mode', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'hub.verify_token', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'hub.challenge', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Webhook verified' },
            403: { description: 'Verification failed' },
          },
        },
        post: {
          tags: ['Webhooks'],
          summary: 'Receive WhatsApp webhook events',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    entry: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          changes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                value: {
                                  type: 'object',
                                  properties: {
                                    messages: { type: 'array' },
                                    statuses: { type: 'array' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Webhook processed successfully' },
          },
        },
      },
    },
  },
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

export default swaggerSpecs;
