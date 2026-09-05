import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/errorHandler';
import { auditRepository } from '../repositories/audit.repository';

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

    await auditRepository.log(user.id, 'created', user.id);
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
    await auditRepository.log(id, 'updated', id, data);
    return user;
  },

  async updateRole(id: string, role: Role, performedBy: string) {
    await this.getById(id);
    const user = await userRepository.updateRole(id, role);
    await auditRepository.log(id, 'role_changed', performedBy, { newRole: role });
    return user;
  },

  async remove(id: string, performedBy: string) {
    await this.getById(id);
    await auditRepository.log(id, 'deleted', performedBy);
    return userRepository.delete(id);
  },
};