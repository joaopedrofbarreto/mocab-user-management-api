import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/user.controller';
import { createUserSchema, updateUserSchema, updateRoleSchema } from '../schemas/user.schema';
import { authenticate, authorize } from '../middlewares/auth';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/', { schema: createUserSchema }, userController.create);
  app.get('/', { preHandler: [authenticate] }, userController.list);
  app.get('/:id', { preHandler: [authenticate] }, userController.getById);
  app.put('/:id', { schema: updateUserSchema, preHandler: [authenticate] }, userController.update);
  app.patch(
    '/:id/role',
    { schema: updateRoleSchema, preHandler: [authenticate, authorize('ADMIN')] },
    userController.updateRole
  );
  app.delete('/:id', { preHandler: [authenticate, authorize('ADMIN')] }, userController.remove);
}