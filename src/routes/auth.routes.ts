import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller';
import { loginSchema } from '../schemas/auth.schema';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/login', { schema: loginSchema }, authController.login);
}