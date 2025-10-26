import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { corsOptions } from './utils/cors';
import { errorMiddleware } from './utils/errors';
import { logger } from './utils/logger';
import { validateEnv } from './utils/env';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import spotifyRouter from './routes/spotify';
import mcpRouter from './routes/mcp';
import gmailRouter from './routes/gmail';

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.SERVER_PORT || 5173;

app.use(corsOptions);
app.use(express.json());
app.use(cookieParser());

app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

app.use(healthRouter);
app.use(authRouter);
app.use(spotifyRouter);
app.use(mcpRouter);
app.use(gmailRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  logger.info({ port: PORT, mockMode: process.env.MOCK_MODE === 'true' }, 'Server started');
  logger.info(`orbit-mcp-spotify running on http://localhost:${PORT}`);
  logger.info(`Mock mode: ${process.env.MOCK_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`Origin: ${process.env.ORIGIN || 'http://localhost:3000'}`);
});

