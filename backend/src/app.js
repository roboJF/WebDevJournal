import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import entryRoutes from './routes/entries.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Needed behind a reverse proxy (Render, Railway, Heroku, nginx) so
// secure cookies and rate limiting see the real client connection.
app.set('trust proxy', env.trustProxy);

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = same-origin or non-browser client (curl, health checks)
      if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
// Only application/json bodies are parsed, which also blocks plain cross-site form posts
app.use('/api/entries', express.json({ limit: '1mb' }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
