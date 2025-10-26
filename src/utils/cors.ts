import cors from 'cors';

export const corsOptions = cors({
  origin: process.env.ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

