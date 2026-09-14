import { ClaudeVisionResponse, ScoreBreakdown } from '@/types/analysis';
import { SCORING_WEIGHTS_DEFAULT } from './constants';

export interface ScoringWeights {
  aesthetic: number;
  emotion: number;
  social: number;
  composition: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  ...SCORING_WEIGHTS_DEFAULT,
};

// Parse stringified JSON responses from Claude
function safeParseJSON(str: string): any {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch {
    return null;
  }
}

// Calculate overall score with weights
export function calculateOverallScore(
  breakdown: ScoreBreakdown,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total === 0) return 0;

  const weighted =
    breakdown.composition * weights.composition +
    breakdown.emotion * weights.emotion +
    breakdown.aesthetic * weights.aesthetic +
    breakdown.social * weights.social;

  return Math.round((weighted / total) * 100) / 100;
}

// Extract scores from AI analysis response
export function extractScoresFromAnalysis(
  composition: string,
  emotion: string,
  aesthetic: string,
  social: string
): ScoreBreakdown {
  const comp = safeParseJSON(composition);
  const emo = safeParseJSON(emotion);
  const aes = safeParseJSON(aesthetic);
  const soc = safeParseJSON(social);

  return {
    composition: Number(comp?.score || 0),
    emotion: Number(emo?.score || 0),
    aesthetic: Number(aes?.score || 0),
    social: Number(soc?.score || 0),
    overall: 0, // Will be calculated separately
  };
}

// Score a single photo based on Claude Vision response
export function scoreFromClaudeResponse(response: ClaudeVisionResponse): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    composition: response.composition.score,
    emotion: response.emotion.score,
    aesthetic: response.aesthetic.score,
    social: response.social.score,
    overall: 0,
  };

  breakdown.overall = calculateOverallScore(breakdown);
  return breakdown;
}

// Rank photos by score
export function rankPhotos(
  photos: Array<{ id: string; scores: ScoreBreakdown }>
): Array<{ id: string; scores: ScoreBreakdown; rank: number }> {
  return photos
    .sort((a, b) => b.scores.overall - a.scores.overall)
    .map((photo, index) => ({
      ...photo,
      rank: index + 1,
    }));
}

// Get top N photos
export function getTopNPhotos(
  photos: Array<{ id: string; scores: ScoreBreakdown }>,
  n: number
): Array<{ id: string; scores: ScoreBreakdown; rank: number }> {
  return rankPhotos(photos).slice(0, n);
}

// Validate score is within range
export function isValidScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 10;
}

// Normalize score to 0-10 range
export function normalizeScore(score: number, max: number = 10): number {
  return Math.min(Math.max(score, 0), max);
}

// Convert score to letter grade
export function scoreToGrade(score: number): string {
  if (score >= 9) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8) return 'A-';
  if (score >= 7.5) return 'B+';
  if (score >= 7) return 'B';
  if (score >= 6.5) return 'B-';
  if (score >= 6) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5) return 'C-';
  if (score >= 4.5) return 'D+';
  if (score >= 4) return 'D';
  return 'F';
}

// Get score color class
export function getScoreColorClass(score: number): string {
  if (score >= 8) return 'text-green-600 bg-green-100';
  if (score >= 6) return 'text-blue-600 bg-blue-100';
  if (score >= 4) return 'text-yellow-600 bg-yellow-100';
  if (score >= 2) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

// Calculate weighted average for multiple photos
export function calculateAverageScore(
  photos: Array<{ scores: ScoreBreakdown }>
): ScoreBreakdown {
  if (photos.length === 0) {
    return { composition: 0, emotion: 0, aesthetic: 0, social: 0, overall: 0 };
  }

  const total = photos.reduce(
    (acc, photo) => ({
      composition: acc.composition + photo.scores.composition,
      emotion: acc.emotion + photo.scores.emotion,
      aesthetic: acc.aesthetic + photo.scores.aesthetic,
      social: acc.social + photo.scores.social,
      overall: acc.overall + photo.scores.overall,
    }),
    { composition: 0, emotion: 0, aesthetic: 0, social: 0, overall: 0 }
  );

  const count = photos.length;
  return {
    composition: total.composition / count,
    emotion: total.emotion / count,
    aesthetic: total.aesthetic / count,
    social: total.social / count,
    overall: total.overall / count,
  };
}

// Check if photo meets minimum threshold
export function meetsThreshold(
  scores: ScoreBreakdown,
  threshold: number = 5.0
): boolean {
  return scores.overall >= threshold;
}

// Get score distribution
export function getScoreDistribution(
  photos: Array<{ scores: ScoreBreakdown }>
): Record<string, number> {
  const distribution: Record<string, number> = {
    excellent: 0, // 8-10
    good: 0,      // 6-8
    average: 0,   // 4-6
    poor: 0,      // 2-4
    terrible: 0,  // 0-2
  };

  photos.forEach(({ scores }) => {
    if (scores.overall >= 8) distribution.excellent++;
    else if (scores.overall >= 6) distribution.good++;
    else if (scores.overall >= 4) distribution.average++;
    else if (scores.overall >= 2) distribution.poor++;
    else distribution.terrible++;
  });

  return distribution;
}