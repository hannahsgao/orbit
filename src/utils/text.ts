const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'may', 'might', 'can', 'my', 'your', 'their',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOPWORDS.has(token));
}

export function computeTermFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

export function scoreTokens(
  freq: Map<string, number>,
  totalDocs: number
): Array<{ token: string; score: number }> {
  const scored = Array.from(freq.entries()).map(([token, count]) => ({
    token,
    score: count / totalDocs,
  }));
  return scored.sort((a, b) => b.score - a.score);
}

export const THEME_KEYWORDS = {
  calm: ['sleep', 'chill', 'relax', 'ambient', 'calm', 'peaceful', 'meditation', 'study', 'focus', 'quiet'],
  motion: ['run', 'workout', 'gym', 'energy', 'drive', 'roadtrip', 'car', 'cardio', 'hype', 'pump'],
  melancholy: ['sad', 'cry', 'rain', 'lonely', 'alone', 'heartbreak', 'breakup', 'feels', 'emo', 'mood'],
  joy: ['happy', 'party', 'dance', 'fun', 'summer', 'beach', 'friends', 'celebrate', 'good', 'vibes'],
  curiosity: ['discover', 'new', 'indie', 'underground', 'fresh', 'explore', 'alternative', 'experimental'],
  nostalgia: ['throwback', 'oldies', 'classics', 'retro', 'memories', 'vintage', '80s', '90s', '00s'],
};

export function mapTokensToThemes(tokens: string[]): Map<string, number> {
  const themeScores = new Map<string, number>();
  
  for (const token of tokens) {
    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      if (keywords.includes(token)) {
        themeScores.set(theme, (themeScores.get(theme) || 0) + 1);
      }
    }
  }
  
  return themeScores;
}

