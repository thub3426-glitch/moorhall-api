const adminDocs = {
  getDashboard: {
    tags: ['Admin'],
    summary: 'Get admin dashboard statistics',
    responses: {
      200: { description: 'Dashboard statistics retrieved successfully' },
    },
  },
};

export default adminDocs;
