import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(jwt, { secret: process.env.JWT_SECRET as string });
  app.register(rateLimit, { global: false }); // global: false = só aplica onde configurado explicitamente
  app.register(swagger, {
    openapi: {
      info: {
        title: 'MOCAB User Management API',
        version: '1.0.0',
      },
    },
  });
  app.register(swaggerUI, { routePrefix: '/docs' });
  app.setErrorHandler(errorHandler);
  app.register(authRoutes, { prefix: '/auth' });
  app.register(userRoutes, { prefix: '/users' });
  return app;
}