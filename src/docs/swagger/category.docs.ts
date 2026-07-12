const categoryDocs = {
  createCategory: {
    tags: ['Categories'],
    summary: 'Create a new category',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'slug', 'type'],
            properties: {
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['FOOD', 'COFFEE', 'DRINK', 'BAKERY', 'SPECIAL'] },
              displayOrder: { type: 'integer' },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: { 201: { description: 'Category created successfully' } },
  },
  getCategories: {
    tags: ['Categories'],
    summary: 'Get all categories',
    parameters: [
      { in: 'query', name: 'includeInactive', schema: { type: 'boolean' } },
    ],
    responses: { 200: { description: 'Categories retrieved successfully' } },
  },
  getCategoryById: {
    tags: ['Categories'],
    summary: 'Get category by ID',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Category retrieved successfully' } },
  },
  updateCategory: {
    tags: ['Categories'],
    summary: 'Update category',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['FOOD', 'COFFEE', 'DRINK', 'BAKERY', 'SPECIAL'] },
              displayOrder: { type: 'integer' },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'Category updated successfully' } },
  },
  deleteCategory: {
    tags: ['Categories'],
    summary: 'Delete category',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Category deleted successfully' } },
  },
};

export default categoryDocs;
