import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/errorHandler';
import { auditRepository } from '../repositories/audit.repository';

const PROTECTED_ADMIN_EMAIL = 'admin@mocab.com';


async function logAuditSafely(
  userId: string,
  action: 'created' | 'updated' | 'deleted' | 'role_changed',
  performedBy: string,
  details?: object
) {
  try {
    await auditRepository.log(userId, action, performedBy, details);
  } catch (err) {
    console.error('Falha ao registrar audit log (não bloqueante):', err);
  }
}

export const userService = {
  async create(data: { name: string; email: string; password: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError('E-mail já cadastrado', 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'USER', // cadastro público nunca define role — só o seed inicial ou um admin via PATCH /role
    });

    await logAuditSafely(user.id, 'created', user.id);
    return user;
  },

  list(filters: { role?: Role; createdFrom?: Date; createdTo?: Date }) {
    return userRepository.findAll(filters);
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user;
  },

async update(id: string, data: { name?: string; email?: string }, requestingUser: { sub: string; role: string }) {
  await this.getById(id);

  const isSelf = requestingUser.sub === id;
  const isAdmin = requestingUser.role === 'ADMIN';
  if (!isSelf && !isAdmin) {
    throw new AppError('Você só pode editar seus próprios dados', 403);
  }

  const user = await userRepository.update(id, data);
  await logAuditSafely(id, 'updated', requestingUser.sub, data);
  return user;
},

  async updateRole(id: string, role: Role, performedBy: string) {
    const user = await this.getById(id);

    if (user.email === PROTECTED_ADMIN_EMAIL && role !== 'ADMIN') {
      throw new AppError('Não é possível rebaixar o administrador inicial do sistema', 403);
    }

    const updated = await userRepository.updateRole(id, role);
    await logAuditSafely(id, 'role_changed', performedBy, { newRole: role });
    return updated;
  },

  async remove(id: string, performedBy: string) {
    const user = await this.getById(id);

    if (user.email === PROTECTED_ADMIN_EMAIL) {
      throw new AppError('Não é possível remover o administrador inicial do sistema', 403);
    }

    await logAuditSafely(id, 'deleted', performedBy);
    return userRepository.delete(id);
  },
};