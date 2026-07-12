const activityDocs = {
  getActivities: {
    tags: ['Activity'],
    summary: 'Get all activity logs',
    parameters: [
      { in: 'query', name: 'type', schema: { type: 'string' } },
      { in: 'query', name: 'entityType', schema: { type: 'string' } },
      { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
      { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
    ],
    responses: { 200: { description: 'Activity logs retrieved successfully' } },
  },
  getActivityById: {
    tags: ['Activity'],
    summary: 'Get activity log by ID',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Activity log retrieved successfully' } },
  },
};

export default activityDocs;
