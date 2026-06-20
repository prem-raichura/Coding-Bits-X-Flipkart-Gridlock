import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './service.js';

export const upload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No CSV file uploaded (field name: file)' });
    return;
  }
  const run = await service.createRun(req.file, req.user!.id);
  // Fire-and-forget: don't await so the response returns immediately
  service.process(run.run_id).catch(() => {/* logged inside process() */});
  res.status(202).json({ run_id: run.run_id, status: 'pending' });
});

export const getHistory = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await service.history());
});
