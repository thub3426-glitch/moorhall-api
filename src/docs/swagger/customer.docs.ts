const customerDocs = {
  getCustomers: {
    tags: ['Customers'],
    summary: 'Get all customers with pagination and search',
    parameters: [
      { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
      { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      { in: 'query', name: 'search', schema: { type: 'string' } },
    ],
    responses: { 200: { description: 'Customers retrieved successfully' } },
  },
  getCustomerByPhone: {
    tags: ['Customers'],
    summary: 'Get customer by phone number',
    parameters: [{ in: 'path', name: 'phone', required: true, schema: { type: 'string', example: '+250780123456' } }],
    responses: { 200: { description: 'Customer retrieved successfully' }, 404: { description: 'Customer not found' } },
  },
};

export default customerDocs;
