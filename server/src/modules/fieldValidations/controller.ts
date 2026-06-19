import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './service.js';
import { CreateValidationSchema } from './schema.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = CreateValidationSchema.parse(req.body);
  res.status(201).json(await service.create(data, req.user!.id));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { cell_id, officer_id } = req.query as Record<string, string | undefined>;
  res.json(await service.list({ cell_id, officer_id }));
});
