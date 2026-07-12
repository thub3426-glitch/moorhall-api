const notificationDocs = {
  getNotifications: {
    tags: ['Notifications'],
    summary: 'Get all notification logs',
    parameters: [
      { in: 'query', name: 'sentStatus', schema: { type: 'string' } },
      { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
      { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
    ],
    responses: { 200: { description: 'Notification logs retrieved successfully' } },
  },
  getNotificationById: {
    tags: ['Notifications'],
    summary: 'Get notification log by ID',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Notification log retrieved successfully' } },
  },
  resendNotification: {
    tags: ['Notifications'],
    summary: 'Resend a failed notification',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Notification resent successfully' } },
  },
};

export default notificationDocs;
