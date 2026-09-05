import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const userRepository = {
  create: (data: { name: string; email: string; passwordHash: string; role?: Role }) =>
    prisma.user.create({ data }),

  findAll: (filters: { role?: Role; createdFrom?: Date; createdTo?: Date }) =>
    prisma.user.findMany({
      where: {
        role: filters.role,
        createdAt: {
          gte: filters.createdFrom,
          lte: filters.createdTo,
        },
      },
    }),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  findByEmail: (email: string) => prisma.user.findUnique({ where: { email: email.toLowerCase() } }),

  update: (id: string, data: { name?: string; email?: string; passwordHash?: string }) =>
    prisma.user.update({ where: { id }, data }),

  updateRole: (id: string, role: Role) =>
    prisma.user.update({ where: { id }, data: { role } }),

  delete: (id: string) => prisma.user.delete({ where: { id } }),
};