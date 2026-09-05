import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './errorHandler';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError('Token ausente ou inválido', 401);
  }
}

export function authorize(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as { role: string };
    if (!allowedRoles.includes(payload.role)) {
      throw new AppError('Acesso negado para este perfil', 403);
    }
  };
}