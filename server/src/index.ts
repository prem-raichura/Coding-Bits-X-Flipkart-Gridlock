import { env } from './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { errorHandler } from './middleware/error.js';
import authRouter from './modules/auth/router.js';
import registrationRequestsRouter from './modules/registrationRequests/router.js';
import usersRouter from './modules/users/router.js';
import predictionRunsRouter from './modules/predictionRuns/router.js';
import predictionCellsRouter from './modules/predictionCells/router.js';
import assignmentsRouter from './modules/assignments/router.js';
import notificationsRouter from './modules/notifications/router.js';
import fieldValidationsRouter from './modules/fieldValidations/router.js';
import modelFeedbackBatchesRouter from './modules/modelFeedbackBatches/router.js';
import uploadsRouter from './modules/uploads/router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()) }));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/registration-requests', registrationRequestsRouter);
app.use('/api/users', usersRouter);
app.use('/api/prediction-runs', predictionRunsRouter);
app.use('/api/prediction-cells', predictionCellsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/field-validations', fieldValidationsRouter);
app.use('/api/model-feedback-batches', modelFeedbackBatchesRouter);
app.use('/api/uploads', uploadsRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`\n🚀 Officer App Server → http://localhost:${env.PORT}/api\n`);
});

export default app;
