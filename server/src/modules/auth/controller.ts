import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './service.js';
import { RegisterSchema, LoginSchema } from './schema.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = RegisterSchema.parse(req.body);
  const result = await service.register(data);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = LoginSchema.parse(req.body);
  const result = await service.login(username, password);
  res.json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getMe(req.user!.id);
  res.json(result);
});
