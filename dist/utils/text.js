"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEME_KEYWORDS = void 0;
exports.tokenize = tokenize;
exports.computeTermFrequency = computeTermFrequency;
exports.scoreTokens = scoreTokens;
exports.mapTokensToThemes = mapTokensToThemes;
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'can', 'my', 'your', 'their',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
]);
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2 && !STOPWORDS.has(token));
}
function computeTermFrequency(tokens) {
    const freq = new Map();
    for (const token of tokens) {
        freq.set(token, (freq.get(token) || 0) + 1);
    }
    return freq;
}
function scoreTokens(freq, totalDocs) {
    const scored = Array.from(freq.entries()).map(([token, count]) => ({
        token,
        score: count / totalDocs,
    }));
    return scored.sort((a, b) => b.score - a.score);
}
exports.THEME_KEYWORDS = {
    calm: ['sleep', 'chill', 'relax', 'ambient', 'calm', 'peaceful', 'meditation', 'study', 'focus', 'quiet'],
    motion: ['run', 'workout', 'gym', 'energy', 'drive', 'roadtrip', 'car', 'cardio', 'hype', 'pump'],
    melancholy: ['sad', 'cry', 'rain', 'lonely', 'alone', 'heartbreak', 'breakup', 'feels', 'emo', 'mood'],
    joy: ['happy', 'party', 'dance', 'fun', 'summer', 'beach', 'friends', 'celebrate', 'good', 'vibes'],
    curiosity: ['discover', 'new', 'indie', 'underground', 'fresh', 'explore', 'alternative', 'experimental'],
    nostalgia: ['throwback', 'oldies', 'classics', 'retro', 'memories', 'vintage', '80s', '90s', '00s'],
};
function mapTokensToThemes(tokens) {
    const themeScores = new Map();
    for (const token of tokens) {
        for (const [theme, keywords] of Object.entries(exports.THEME_KEYWORDS)) {
            if (keywords.includes(token)) {
                themeScores.set(theme, (themeScores.get(theme) || 0) + 1);
            }
        }
    }
    return themeScores;
}
//# sourceMappingURL=text.js.map