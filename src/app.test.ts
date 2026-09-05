import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from './app';
import { FastifyInstance } from 'fastify';

describe('User routes (integracao)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  it('retorna 401 ao listar usuarios sem token', async () => {
    const response = await app.inject({ method: 'GET', url: '/users' });
    expect(response.statusCode).toBe(401);
  });

  it('retorna 400 ao criar usuario com dados invalidos', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: '', email: 'nao-e-email' },
    });
    expect(response.statusCode).toBe(400);
  });
});