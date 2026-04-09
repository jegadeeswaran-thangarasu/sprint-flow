import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import organisationRoutes from './routes/organisationRoutes';

// ─── Dev Route Printer ───────────────────────────────────────────────────────
// Recursively walks the Express router stack and logs every registered route.
type ExpressLayer = {
  route?: { path: string; methods: Record<string, boolean> };
  name?: string;
  regexp: RegExp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle?: { stack?: ExpressLayer[]; [key: string]: any };
};

const extractPrefix = (regexp: RegExp): string => {
  // Express stores the path as a regexp like /^\/api\/v1\/auth\/?(?=\/|$)/i
  // Pull out the literal path segment between the anchors
  const src = regexp.source
    .replace(/^\^\\?/, '')
    .replace(/\\\/\?\(\?=\\\/\|\$\).*$/, '')
    .replace(/\\\//g, '/');
  return src.startsWith('/') ? src : `/${src}`;
};

const walkRoutes = (stack: ExpressLayer[], prefix = ''): void => {
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase().padEnd(6);
      console.log(`  ${methods} ${prefix}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle?.stack) {
      const base = extractPrefix(layer.regexp);
      walkRoutes(layer.handle.stack, base === '/' ? prefix : base);
    }
  }
};

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organisations', organisationRoutes);
// app.use('/api/v1/projects', projectRoutes);
// app.use('/api/v1/issues', issueRoutes);

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: null, message: 'SprintFlow API is running' });
});

app.use(errorHandler);

if (process.env.NODE_ENV === 'development') {
  console.log('\nMounted routes:');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walkRoutes((app as any)._router.stack);
  console.log('');
}

export default app;
