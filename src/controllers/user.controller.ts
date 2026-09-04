import { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service';

export const userController = {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const user = await userService.create(request.body as any);
    return reply.status(201).send(user);
  },

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { role, createdFrom, createdTo } = request.query as any;
    const users = await userService.list({
      role,
      createdFrom: createdFrom ? new Date(createdFrom) : undefined,
      createdTo: createdTo ? new Date(createdTo) : undefined,
    });
    return reply.send(users);
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const user = await userService.getById(id);
    return reply.send(user);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const user = await userService.update(id, request.body as any);
    return reply.send(user);
  },

  async updateRole(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { role } = request.body as any;
    const user = await userService.updateRole(id, role);
    return reply.send(user);
  },

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    await userService.remove(id);
    return reply.status(204).send();
  },
};