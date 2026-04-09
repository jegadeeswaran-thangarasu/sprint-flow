import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import organisationRoutes from './routes/organisationRoutes';
import projectRoutes from './routes/projectRoutes';
import issueRoutes from './routes/issueRoutes';
import commentRoutes from './routes/commentRoutes';
import sprintRoutes from './routes/sprintRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';

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

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
      : [];

    const allowedInDev = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ];

    const allowed =
      process.env.NODE_ENV === 'development'
        ? [...allowedOrigins, ...allowedInDev]
        : allowedOrigins;

    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS policy blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Health check — before rate limiter so it's always reachable
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV });
});

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
app.use('/api/v1/organisations/:orgSlug/dashboard', dashboardRoutes);
app.use('/api/v1/organisations/:orgSlug/projects', projectRoutes);
app.use(
  '/api/v1/organisations/:orgSlug/projects/:projectId/reports',
  reportRoutes
);
app.use('/api/v1/organisations/:orgSlug/projects/:projectId/issues', issueRoutes);
app.use(
  '/api/v1/organisations/:orgSlug/projects/:projectId/issues/:issueId/comments',
  commentRoutes
);
app.use('/api/v1/organisations/:orgSlug/projects/:projectId/sprints', sprintRoutes);

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
