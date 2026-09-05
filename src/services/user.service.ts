import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/errorHandler';
import { auditRepository } from '../repositories/audit.repository';

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
  async create(data: { name: string; email: string; password: string; role?: Role }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError('E-mail já cadastrado', 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? 'USER',
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

  async update(id: string, data: { name?: string; email?: string }) {
    await this.getById(id);
    const user = await userRepository.update(id, data);
    await logAuditSafely(id, 'updated', id, data);
    return user;
  },

  async updateRole(id: string, role: Role, performedBy: string) {
    await this.getById(id);
    const user = await userRepository.updateRole(id, role);
    await logAuditSafely(id, 'role_changed', performedBy, { newRole: role });
    return user;
  },

  async remove(id: string, performedBy: string) {
    await this.getById(id);
    await logAuditSafely(id, 'deleted', performedBy);
    return userRepository.delete(id);
  },
};