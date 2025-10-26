import { Router } from 'express';
import { expandTheme, type ParentTheme } from '../services/theme_expander';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

// Expand a theme into sub-themes
router.post('/themes/expand', async (req, res) => {
  try {
    const { parentTheme, userId } = req.body;

    if (!parentTheme || !parentTheme.label) {
      return res.status(400).json({
        error: 'Missing required field: parentTheme with label'
      });
    }

    logger.info({ 
      parentLabel: parentTheme.label, 
      userId 
    }, 'Received theme expansion request');

    // Call LLM to generate sub-themes
    const subthemes = await expandTheme({
      parentTheme: parentTheme as ParentTheme,
      userContext: userId ? { userId } : undefined,
    });

    return res.json({
      parentThemeId: parentTheme.id,
      subthemes: subthemes.map((subtheme) => ({
        label: subtheme.label,
        rationale: subtheme.rationale,
        sources: subtheme.sources,
        level: 'subtheme', // Always subtheme when generated from parent
        dataSource: parentTheme.dataSource,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to expand theme');
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to expand theme',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;

