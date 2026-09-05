import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(jwt, { secret: process.env.JWT_SECRET as string });

  app.setErrorHandler(errorHandler);
  app.register(authRoutes, { prefix: '/auth' });
  app.register(userRoutes, { prefix: '/users' });

  return app;
}