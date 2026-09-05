import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/errorHandler';

export const authService = {
  async validateCredentials(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError('Credenciais inválidas', 401);

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) throw new AppError('Credenciais inválidas', 401);

    return user;
  },
};