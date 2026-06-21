import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './service.js';

export const upload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No CSV file uploaded (field name: file)' });
    return;
  }
  const run = await service.createRun(req.file, req.user!.id);
  // Must await on serverless: the function freezes after the response, so any
  // un-awaited background work would be killed. The buffer also only lives for
  // this invocation, so it is passed straight through.
  await service.process(run.run_id, req.file.buffer);
  res.status(202).json({ run_id: run.run_id, status: 'pending' });
});

export const getHistory = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await service.history());
});
