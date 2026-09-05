import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mocab.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin já existe, nada a fazer.');
    return;
  }

  const passwordHash = await bcrypt.hash('TrocarSenha123', 10);
  await prisma.user.create({
    data: { name: 'Admin', email, passwordHash, role: 'ADMIN' },
  });
  console.log('Usuário admin inicial criado:', email);
}

main().finally(() => prisma.$disconnect());