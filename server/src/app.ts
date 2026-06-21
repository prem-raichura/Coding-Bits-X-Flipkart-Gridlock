import express from 'express';
import cors from 'cors';
// helmet 8's package "exports" has no "types" condition, so some TS/resolver
// combos (e.g. the Vercel build) type the default as a non-callable namespace.
// Resolve the callable defensively so the build is environment-proof.
import * as helmetModule from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';

const helmet = ((helmetModule as { default?: unknown }).default ?? helmetModule) as (
  ...args: unknown[]
) => express.RequestHandler;
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
import csvUploadRouter from './modules/csvUpload/router.js';
import analyticsRouter from './modules/analytics/router.js';
import stationsRouter from './modules/stations/router.js';
import locationRouter from './modules/location/router.js';
import unassignRequestsRouter from './modules/unassignRequests/router.js';
import jobsRouter from './modules/jobs/router.js';

const app = express();

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    // Allow any Vercel deployment (prod + preview URLs) without env churn.
    if (host === 'localhost' || host.endsWith('.vercel.app')) return true;
  } catch { /* malformed origin */ }
  return false;
}

const corsMiddleware = cors({
  origin(origin, cb) {
    // Non-browser clients (curl, server-to-server) send no Origin.
    if (!origin || isAllowedOrigin(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
});

app.use(helmet());
app.use(corsMiddleware); // also answers OPTIONS preflight automatically
app.use(morgan('dev'));
app.use(express.json());

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
app.use('/api/csv', csvUploadRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/location', locationRouter);
app.use('/api/unassign-requests', unassignRequestsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api', analyticsRouter);

app.use(errorHandler);

export default app;
