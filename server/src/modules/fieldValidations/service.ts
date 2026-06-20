import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.js';
import type { z } from 'zod';
import type { CreateValidationSchema } from './schema.js';
import type { CongestionSeverity } from '@prisma/client';

export async function create(data: z.infer<typeof CreateValidationSchema>, officerId: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id: data.assignment_id } });
  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (assignment.user_id !== officerId) throw new AppError(403, 'Not your assignment');
  if (assignment.status === 'completed') throw new AppError(400, 'Assignment already validated');

  const existing = await prisma.fieldValidation.findUnique({
    where: { assignment_id: data.assignment_id },
  });
  if (existing) throw new AppError(409, 'Validation already submitted for this assignment');

  return prisma.$transaction(async (tx) => {
    const validation = await tx.fieldValidation.create({
      data: {
        ...data,
        officer_id: officerId,
        congestion_severity: data.congestion_severity as CongestionSeverity | undefined,
      },
    });
    await tx.assignment.update({
      where: { id: data.assignment_id },
      data: { status: 'completed' },
    });
    // Free the officer once the report is in.
    await tx.user.update({ where: { id: officerId }, data: { availability: 'available' } });
    return validation;
  });
}

export async function list(filters: { cell_id?: string; officer_id?: string }) {
  return prisma.fieldValidation.findMany({
    where: {
      ...(filters.cell_id ? { cell_id: filters.cell_id } : {}),
      ...(filters.officer_id ? { officer_id: filters.officer_id } : {}),
    },
    orderBy: { submitted_at: 'desc' },
  });
}
