export const createUserSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['ADMIN', 'USER'] },
    },
  },
};

export const updateUserSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
    },
  },
};

export const updateRoleSchema = {
  body: {
    type: 'object',
    required: ['role'],
    properties: {
      role: { type: 'string', enum: ['ADMIN', 'USER'] },
    },
  },
};