import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.js';
import type { z } from 'zod';
import type { PatchUserSchema } from './schema.js';

const safeSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  role: true,
  police_station: true,
  number: true,
  avatar_url: true,
  push_token: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

export async function list() {
  return prisma.user.findMany({ select: safeSelect, orderBy: { created_at: 'desc' } });
}

export async function getById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function patch(id: string, data: z.infer<typeof PatchUserSchema>) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found');
  return prisma.user.update({ where: { id }, data, select: safeSelect });
}

export async function savePushToken(id: string, push_token: string) {
  return prisma.user.update({ where: { id }, data: { push_token }, select: safeSelect });
}
