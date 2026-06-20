import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    cb(null, randomUUID() + '.csv');
  },
});

const upload = multer({ storage, limits: { fileSize: 512 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.post('/', upload.single('file'), controller.upload);
router.get('/history', controller.getHistory);

export default router;
