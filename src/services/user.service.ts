import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/errorHandler';

export const userService = {
  async create(data: { name: string; email: string; password: string; role?: Role }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError('E-mail já cadastrado', 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    return userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? 'USER',
    });
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
    await this.getById(id); // garante que existe, senão lança 404
    return userRepository.update(id, data);
  },

  async updateRole(id: string, role: Role) {
    await this.getById(id);
    return userRepository.updateRole(id, role);
  },

  async remove(id: string) {
    await this.getById(id);
    return userRepository.delete(id);
  },
};