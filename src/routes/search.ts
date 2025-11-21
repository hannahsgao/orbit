import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { SearchItemSchema, type SearchItem } from '../schemas/search';
import { extractSearchThemes } from '../services/search_themes';

const router = Router();

// Load mock search history data
function loadMockSearchHistory(): SearchItem[] {
  try {
    const mockDataPath = join(__dirname, '../data/mockSearchHistory.json');
    const rawData = readFileSync(mockDataPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    // Validate each item
    return data.map((item: any) => SearchItemSchema.parse(item));
  } catch (error) {
    logger.error({ error }, 'Failed to load mock search history');
    throw new AppError(500, 'Failed to load search history data');
  }
}

// Get search history (mock data)
router.get('/search/history', async (_req, res) => {
  try {
    const searches = loadMockSearchHistory();
    
    logger.info({ count: searches.length }, 'Loaded mock search history');
    
    return res.json({
      source: 'search',
      analyzedAt: new Date().toISOString(),
      searchesAnalyzed: searches.length,
      searches,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch search history');
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    return res.status(500).json({
      error: 'Failed to fetch search history'
    });
  }
});

// Extract search themes using AI
router.get('/search/themes', async (_req, res) => {
  try {
    const searches = loadMockSearchHistory();
    
    if (searches.length === 0) {
      throw new AppError(400, 'No search history found to analyze');
    }
    
    logger.info({ searchCount: searches.length }, 'Extracting search themes');
    
    // Extract themes using AI
    const themes = await extractSearchThemes({ searches });
    
    return res.json({
      source: 'search',
      analyzedAt: new Date().toISOString(),
      searchesAnalyzed: searches.length,
      themes: themes.themes,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to extract search themes');
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }
    return res.status(500).json({
      error: 'Failed to extract search themes'
    });
  }
});

export default router;

