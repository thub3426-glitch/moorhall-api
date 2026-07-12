const orderDocs = {
  // Guest order creation
  createGuestOrder: {
    tags: ['Orders'],
    summary: 'Create a guest order',
    description: 'Create a new order without authentication (for customer self-service)',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['customerName', 'customerPhone', 'orderType', 'items'],
            properties: {
              customerName: { type: 'string', example: 'Jean Mugisha' },
              customerPhone: { type: 'string', example: '+250788123456' },
              customerAltPhone: { type: 'string', example: '+250788654321' },
              deliveryAddress: { type: 'string', example: '123 Main St, Kigali' },
              locationNotes: { type: 'string', example: 'Near the gas station' },
              orderType: { type: 'string', enum: ['DELIVERY', 'PICKUP'], example: 'DELIVERY' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    menuItemId: { type: 'integer' },
                    quantity: { type: 'integer' },
                    notes: { type: 'string' },
                  },
                },
              },
              notes: { type: 'string', example: 'Please call upon arrival' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'Order created successfully' },
      400: { description: 'Validation error' },
    },
  },

  // Admin order management
  getOrders: {
    tags: ['Orders'],
    summary: 'Get all orders (Admin only)',
    description: 'Retrieve all orders with filtering and pagination',
    security: [{ bearerAuth: [] }],
    parameters: [
      { in: 'query', name: 'status', schema: { type: 'string' } },
      { in: 'query', name: 'paymentStatus', schema: { type: 'string' } },
      { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
      { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
    ],
    responses: { 200: { description: 'Orders retrieved successfully' } },
  },

  getOrderById: {
    tags: ['Orders'],
    summary: 'Get order by ID (Admin only)',
    security: [{ bearerAuth: [] }],
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Order retrieved successfully' }, 404: { description: 'Order not found' } },
  },

  updateOrderStatus: {
    tags: ['Orders'],
    summary: 'Update order status (Admin only)',
    security: [{ bearerAuth: [] }],
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'] },
              note: { type: 'string' },
              sendNotification: { type: 'boolean', default: true },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'Order status updated successfully' } },
  },

  reviewPayment: {
    tags: ['Orders'],
    summary: 'Review payment (Admin only)',
    description: 'Approve or reject order payment',
    security: [{ bearerAuth: [] }],
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['action'],
            properties: {
              action: { type: 'string', enum: ['approve', 'reject'] },
              note: { type: 'string' },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'Payment reviewed successfully' } },
  },

  getPaymentSettings: {
    tags: ['Orders'],
    summary: 'Get payment settings (Admin only)',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Payment settings retrieved successfully' } },
  },

  setPaymentSettings: {
    tags: ['Orders'],
    summary: 'Update payment settings (Admin only)',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['paymentMode'],
            properties: {
              paymentMode: { type: 'string', enum: ['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'] },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'Payment settings updated successfully' } },
  },

  // WhatsApp actions
  sendWhatsAppUpdate: {
    tags: ['Orders'],
    summary: 'Send WhatsApp status update (Admin only)',
    security: [{ bearerAuth: [] }],
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'WhatsApp notification sent successfully' } },
  },

  sendReceipt: {
    tags: ['Orders'],
    summary: 'Send receipt via WhatsApp (Admin only)',
    security: [{ bearerAuth: [] }],
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Receipt sent successfully' } },
  },
};

export default orderDocs;
