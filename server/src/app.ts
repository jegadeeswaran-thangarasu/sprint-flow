import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';

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
// app.use('/api/v1/projects', projectRoutes);
// app.use('/api/v1/issues', issueRoutes);

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: null, message: 'SprintFlow API is running' });
});

app.use(errorHandler);

export default app;
