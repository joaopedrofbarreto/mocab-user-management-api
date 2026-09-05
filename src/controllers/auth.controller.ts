import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

export const authController = {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = request.body as { email: string; password: string };
    const user = await authService.validateCredentials(email, password);

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
    });

    return reply.send({ token });
  },
};