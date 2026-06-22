import { Router } from 'express';
import express from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './controller.js';

// memoryStorage keeps the upload in RAM — required on serverless (read-only FS).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 512 * 1024 * 1024 },
});

// The HF analytics bundle is larger than the global 100kb express.json() cap but
// must stay under Vercel's 4.5MB ingress limit.
const bundleJson = express.json({ limit: '4mb' });

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.post('/', upload.single('file'), controller.upload);
router.post('/store', bundleJson, controller.storeBundle);
router.get('/history', controller.getHistory);

export default router;
