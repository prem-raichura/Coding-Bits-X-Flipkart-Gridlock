import { prisma } from '../../lib/prisma.js';
import { comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/error.js';
import type { z } from 'zod';
import type { RegisterSchema } from './schema.js';

export async function register(data: z.infer<typeof RegisterSchema>) {
  const existing = await prisma.registrationRequest.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new AppError(409, 'Email already registered or pending');
  return prisma.registrationRequest.create({ data });
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.is_active) throw new AppError(401, 'Invalid credentials');
  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError(401, 'Invalid credentials');
  const token = signToken({ id: user.id, role: user.role });
  const { password: _, ...safe } = user;
  return { token, user: safe };
}

export async function getMe(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      police_station: true,
      avatar_url: true,
      number: true,
      push_token: true,
      is_active: true,
      created_at: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}
