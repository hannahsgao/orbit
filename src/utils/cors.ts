import cors from 'cors';

export const corsOptions = cors({
  origin: process.env.ORIGIN || 'http://127.0.0.1:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

