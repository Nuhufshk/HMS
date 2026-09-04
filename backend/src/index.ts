import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { asyncHandler } from './utils/asyncHandler';
import authRouter, { requireAuth } from './modules/auth';
import patientsRouter from './modules/patients';
import appointmentsRouter from './routes/appointments';
import peopleRouter from './routes/people';
import pharmacyRouter from './routes/pharmacy';
import laboratoryRouter from './routes/laboratory';
import recordsRouter from './routes/records';
import billingRouter from './routes/billing';
import miscRouter from './routes/misc';
import bedsRouter from './routes/beds';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Request log for the dev console (before routes so every request is captured).
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${new Date().toISOString().slice(11, 19)}  ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Public: sign-in. Everything else requires a bearer token.
app.use('/api/auth', authRouter);

// Health check (public).
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'adom-hms-backend', time: new Date().toISOString() });
});

app.use('/api', asyncHandler(requireAuth),
  peopleRouter,       // /doctors, /nurses, /departments, /staff
  pharmacyRouter,     // /medicines, /prescriptions
  laboratoryRouter,   // /lab-tests
  recordsRouter,      // /medical-records
  billingRouter,      // /invoices
  miscRouter);        // /notifications, /activity, /search
app.use('/api/patients', asyncHandler(requireAuth), patientsRouter);        // /, /:id
app.use('/api/appointments', asyncHandler(requireAuth), appointmentsRouter); // /, /trend, /:id, /:id/status
app.use('/api/beds', asyncHandler(requireAuth), bedsRouter);                 // /, /wards, /:id, /:id/assign, /:id/release

// 404 for unknown API routes.
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Central error handler — never leak stack traces.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof Error && 'status' in err && typeof (err as { status?: unknown }).status === 'number'
    ? ((err as { status: number }).status)
    : 500;
  console.error(err);
  res.status(status).json({ message: status === 500 ? 'Internal server error' : (err instanceof Error ? err.message : 'Request failed') });
});

app.listen(PORT, HOST, () => {
  console.log(`🏥 Adom Medical Centre HMS API listening on http://${HOST}:${PORT}`);
  console.log('   Demo sign-in: POST /api/auth/login  (e.g. admin@adommedicalcentre.gh / admin123)');
});
