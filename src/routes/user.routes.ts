import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/user.controller';
import { createUserSchema, updateUserSchema, updateRoleSchema } from '../schemas/user.schema';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/', { schema: createUserSchema }, userController.create);
  app.get('/', userController.list);
  app.get('/:id', userController.getById);
  app.put('/:id', { schema: updateUserSchema }, userController.update);
  app.patch('/:id/role', { schema: updateRoleSchema }, userController.updateRole);
  app.delete('/:id', userController.remove);
}