import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files allowed'));
    } else {
      cb(null, true);
    }
  },
});

const router = Router();
router.post('/', requireAuth, requireRole('officer'), upload.single('photo'), controller.uploadPhoto);
export default router;
