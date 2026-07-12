const menuItemDocs = {
  createMenuItem: {
    tags: ['Menu Items'],
    summary: 'Create a new menu item',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'slug', 'categoryId', 'productType', 'price'],
            properties: {
              name: { type: 'string', example: 'Grilled Salmon' },
              slug: { type: 'string', example: 'grilled-salmon' },
              shortDescription: { type: 'string', example: 'Fresh salmon with herbs' },
              description: { type: 'string', example: 'Fresh Atlantic salmon grilled with herbs and served with vegetables' },
              categoryId: { type: 'integer', example: 1 },
              productType: { type: 'string', enum: ['FOOD', 'COFFEE', 'DRINK', 'BAKERY', 'SPECIAL'] },
              price: { type: 'number', example: 25000 },
              imageUrl: { type: 'string', format: 'uri', example: 'https://example.com/salmon.jpg' },
              preparationTime: { type: 'integer', example: 20 },
              sku: { type: 'string', example: 'MENU-001' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'Menu item created successfully' },
      400: { description: 'Validation error' },
      404: { description: 'Category not found' },
      409: { description: 'Menu item with this slug or SKU already exists' },
    },
  },
  getMenuItems: {
    tags: ['Menu Items'],
    summary: 'Get all menu items',
    parameters: [
      { in: 'query', name: 'categoryId', schema: { type: 'integer' } },
      { in: 'query', name: 'includeUnavailable', schema: { type: 'boolean' } },
    ],
    responses: { 200: { description: 'Menu items retrieved successfully' } },
  },
  getMenuItemById: {
    tags: ['Menu Items'],
    summary: 'Get menu item by ID',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Menu item retrieved successfully' }, 404: { description: 'Menu item not found' } },
  },
  updateMenuItem: {
    tags: ['Menu Items'],
    summary: 'Update menu item',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              shortDescription: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              imageUrl: { type: 'string', format: 'uri' },
              isAvailable: { type: 'boolean' },
              isFeatured: { type: 'boolean' },
              preparationTime: { type: 'integer' },
              categoryId: { type: 'integer' },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'Menu item updated successfully' }, 404: { description: 'Menu item or category not found' } },
  },
  toggleAvailability: {
    tags: ['Menu Items'],
    summary: 'Toggle menu item availability',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Menu item availability toggled successfully' }, 404: { description: 'Menu item not found' } },
  },
  deleteMenuItem: {
    tags: ['Menu Items'],
    summary: 'Delete menu item',
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
    responses: { 200: { description: 'Menu item deleted successfully' }, 404: { description: 'Menu item not found' } },
  },
};

export default menuItemDocs;
