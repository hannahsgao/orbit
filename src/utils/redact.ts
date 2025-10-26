import { tokenize, computeTermFrequency } from './text';

export function redactEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [local, domain] = email.split('@');
  
  // Keep first 2 chars of local part, mask rest
  const maskedLocal = local.length > 2 ? local.substring(0, 2) + '***' : local;
  
  // Keep first char of domain, mask middle, keep TLD
  const domainParts = domain.split('.');
  if (domainParts.length > 1) {
    const firstPart = domainParts[0];
    const maskedFirstPart = firstPart.length > 1 ? firstPart[0] + '***' : firstPart;
    const maskedDomain = [maskedFirstPart, ...domainParts.slice(1)].join('.');
    return `${maskedLocal}@${maskedDomain}`;
  }
  
  return `${maskedLocal}@${domain}`;
}

export function parseFromHeader(from: string): { name: string; email: string } {
  // Parse "Name <email@example.com>" or just "email@example.com"
  const match = from.match(/^([^<]+)\s*<([^>]+)>$/);
  
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, ''),
      email: match[2].trim().toLowerCase(),
    };
  }
  
  // Just email
  const email = from.trim().toLowerCase();
  return {
    name: email.split('@')[0],
    email,
  };
}

const PII_REGEX = /\b\d{9,10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;

export function shouldRedactSubject(subject: string): boolean {
  // Check for PII-like patterns
  return PII_REGEX.test(subject);
}

export function truncateSubject(subject: string, maxLength: number = 80): string {
  if (subject.length <= maxLength) {
    return subject;
  }
  return subject.substring(0, maxLength - 3) + '...';
}

export function tokenizeSubject(subject: string): string[] {
  // Use existing tokenizer from text utils
  return tokenize(subject);
}

export function extractNGrams(tokens: string[], n: number = 2): string[] {
  const ngrams: string[] = [];
  
  // Single tokens
  ngrams.push(...tokens);
  
  // N-grams
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

export function computeTopTokens(
  subjects: string[],
  topK: number = 20
): Array<{ token: string; score: number }> {
  const allTokens: string[] = [];
  
  for (const subject of subjects) {
    const tokens = tokenizeSubject(subject);
    const ngrams = extractNGrams(tokens, 2);
    allTokens.push(...ngrams);
  }
  
  const freq = computeTermFrequency(allTokens);
  const totalDocs = subjects.length;
  
  const scored = Array.from(freq.entries()).map(([token, count]) => ({
    token,
    score: count / Math.max(totalDocs, 1),
  }));
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

