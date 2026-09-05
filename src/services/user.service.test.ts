import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './user.service';
import { userRepository } from '../repositories/user.repository';

vi.mock('../repositories/user.repository');
vi.mock('../repositories/audit.repository', () => ({
  auditRepository: { log: vi.fn() },
}));

describe('userService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanca erro 409 se o e-mail ja existe', async () => {
    (userRepository.findByEmail as any).mockResolvedValue({ id: '1', email: 'joao@teste.com' });

    await expect(
      userService.create({ name: 'Joao', email: 'joao@teste.com', password: '123456' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('cria usuario com sucesso quando e-mail nao existe', async () => {
    (userRepository.findByEmail as any).mockResolvedValue(null);
    (userRepository.create as any).mockResolvedValue({ id: '1', name: 'Joao', role: 'USER' });

    const user = await userService.create({ name: 'Joao', email: 'joao@teste.com', password: '123456' });

    expect(user).toHaveProperty('id');
    expect(userRepository.create).toHaveBeenCalled();
  });
});