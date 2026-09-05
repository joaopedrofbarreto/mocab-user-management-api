import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { userService } from './user.service';
import { userRepository } from '../repositories/user.repository';

vi.mock('../repositories/user.repository');
vi.mock('../repositories/audit.repository', () => ({
  auditRepository: { log: vi.fn() },
}));
vi.mock('bcrypt');

describe('userService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanca erro 409 se o e-mail ja existe', async () => {
    (userRepository.findByEmail as any).mockResolvedValue({ id: '1', email: 'joao@teste.com' });

    await expect(
      userService.create({ name: 'Joao', email: 'joao@teste.com', password: '123456' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('cria usuario com sucesso quando e-mail nao existe', async () => {
    (userRepository.findByEmail as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('hash-fake');
    (userRepository.create as any).mockResolvedValue({ id: '1', name: 'Joao', role: 'USER' });

    const user = await userService.create({ name: 'Joao', email: 'joao@teste.com', password: '123456' });

    expect(user).toHaveProperty('id');
    expect(userRepository.create).toHaveBeenCalled();
  });

  it('normaliza o e-mail para minusculo antes de checar duplicidade', async () => {
    (userRepository.findByEmail as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('hash-fake');
    (userRepository.create as any).mockResolvedValue({ id: '1' });

    await userService.create({ name: 'Joao', email: 'JOAO@TESTE.COM', password: '123456' });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('joao@teste.com');
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'joao@teste.com' })
    );
  });
});

describe('userService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  const existingUser = { id: 'user-1', email: 'joao@teste.com', passwordHash: 'hash-antigo', role: 'USER' };

  it('permite o proprio usuario editar seus dados', async () => {
    (userRepository.findById as any).mockResolvedValue(existingUser);
    (userRepository.update as any).mockResolvedValue({ ...existingUser, name: 'Novo Nome' });

    const result = await userService.update('user-1', { name: 'Novo Nome' }, { sub: 'user-1', role: 'USER' });

    expect(result.name).toBe('Novo Nome');
  });

  it('bloqueia usuario comum editando outro usuario (403)', async () => {
    (userRepository.findById as any).mockResolvedValue(existingUser);

    await expect(
      userService.update('user-1', { name: 'Hack' }, { sub: 'outro-usuario', role: 'USER' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('permite admin editar outro usuario', async () => {
    (userRepository.findById as any).mockResolvedValue(existingUser);
    (userRepository.update as any).mockResolvedValue({ ...existingUser, name: 'Editado pelo admin' });

    const result = await userService.update(
      'user-1',
      { name: 'Editado pelo admin' },
      { sub: 'admin-1', role: 'ADMIN' }
    );

    expect(result.name).toBe('Editado pelo admin');
  });

  it('exige senha atual ao trocar a propria senha', async () => {
    (userRepository.findById as any).mockResolvedValue(existingUser);

    await expect(
      userService.update('user-1', { password: 'novaSenha123' }, { sub: 'user-1', role: 'USER' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejeita senha atual incorreta (401)', async () => {
    (userRepository.findById as any).mockResolvedValue(existingUser);
    (bcrypt.compare as any).mockResolvedValue(false);

    await expect(
      userService.update(
        'user-1',
        { password: 'novaSenha123', currentPassword: 'senhaErrada' },
        { sub: 'user-1', role: 'USER' }
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('troca a propria senha com sucesso quando a senha atual bate', async () => {
    (userRepository.findById as any).mockResolvedValue(existingUser);
    (bcrypt.compare as any).mockResolvedValue(true);
    (bcrypt.hash as any).mockResolvedValue('hash-novo');
    (userRepository.update as any).mockResolvedValue({ ...existingUser, passwordHash: 'hash-novo' });

    await userService.update(
      'user-1',
      { password: 'novaSenha123', currentPassword: 'senhaAntiga' },
      { sub: 'user-1', role: 'USER' }
    );

    expect(userRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ passwordHash: 'hash-novo' })
    );
  });

  it('admin pode resetar senha de outro usuario sem senha atual', async () => {
    (userRepository.findById as any).mockResolvedValue(existingUser);
    (bcrypt.hash as any).mockResolvedValue('hash-resetado');
    (userRepository.update as any).mockResolvedValue({ ...existingUser, passwordHash: 'hash-resetado' });

    await userService.update('user-1', { password: 'senhaResetada123' }, { sub: 'admin-1', role: 'ADMIN' });

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(userRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ passwordHash: 'hash-resetado' })
    );
  });
});

describe('userService.updateRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bloqueia rebaixar o admin protegido', async () => {
    (userRepository.findById as any).mockResolvedValue({ id: 'admin-1', email: 'admin@mocab.com', role: 'ADMIN' });

    await expect(
      userService.updateRole('admin-1', 'USER' as any, 'outro-admin')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('permite mudar role de um usuario comum', async () => {
    (userRepository.findById as any).mockResolvedValue({ id: 'user-1', email: 'joao@teste.com', role: 'USER' });
    (userRepository.updateRole as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' });

    const result = await userService.updateRole('user-1', 'ADMIN' as any, 'admin-1');

    expect(result.role).toBe('ADMIN');
  });
});

describe('userService.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bloqueia excluir o admin protegido', async () => {
    (userRepository.findById as any).mockResolvedValue({ id: 'admin-1', email: 'admin@mocab.com', role: 'ADMIN' });

    await expect(userService.remove('admin-1', 'outro-admin')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('permite excluir um usuario comum', async () => {
    (userRepository.findById as any).mockResolvedValue({ id: 'user-1', email: 'joao@teste.com', role: 'USER' });
    (userRepository.delete as any).mockResolvedValue(undefined);

    await expect(userService.remove('user-1', 'admin-1')).resolves.not.toThrow();
  });
});