import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  return res.json({
    status: 'ok',
    service: 'orbit-mcp-spotify',
  });
});

export default router;

