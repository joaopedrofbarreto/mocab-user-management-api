import Fastify from 'fastify';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middlewares/errorHandler';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.setErrorHandler(errorHandler);
  app.register(userRoutes, { prefix: '/users' });

  return app;
}