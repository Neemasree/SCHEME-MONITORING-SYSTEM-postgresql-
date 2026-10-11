module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'CivicTrack API',
    version: '1.0.0',
    description: 'API reference for CivicTrack scheme and application monitoring.',
  },
  servers: [{ url: '/api', description: 'Current API host' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['message', 'code'],
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
          requestId: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Sign in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated user and JWT returned' },
          400: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a beneficiary account',
        responses: {
          201: { description: 'Beneficiary account created' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/schemes': {
      get: {
        summary: 'List schemes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated schemes' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        summary: 'Create a scheme',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Scheme created' }, 403: { description: 'Admin role required' } },
      },
    },
    '/applications': {
      get: {
        summary: 'List applications within the caller’s role and district scope',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: { 200: { description: 'Paginated applications' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        summary: 'Submit an application as a beneficiary',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Application submitted' }, 400: { description: 'Validation error' }, 403: { description: 'Beneficiary role required' } },
      },
    },
    '/applications/{id}/approve': {
      put: {
        summary: 'Approve, forward, or reject at the current workflow stage',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Workflow transition applied' },
          400: { description: 'Validation error' },
          403: { description: 'Role not allowed for this stage' },
          409: { description: 'Invalid workflow transition' },
        },
      },
    },
    '/applications/{id}/history': {
      get: {
        summary: 'Read an application audit timeline',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Audit history' }, 404: { description: 'Application not found' } },
      },
    },
    '/dashboard/stats': {
      get: {
        summary: 'Read role-scoped dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard statistics' } },
      },
    },
    '/dashboard/analytics': {
      get: {
        summary: 'Read SQL-backed analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Analytics series' }, 400: { description: 'Invalid date filter' } },
      },
    },
    '/notifications': {
      get: {
        summary: 'List notifications for the authenticated recipient',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Notifications' } },
      },
    },
  },
};
