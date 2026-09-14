'use client';

import type { ScoreBreakdown } from '@/types/analysis';
import { getScoreColorClass, scoreToGrade } from '@/lib/scoring';

interface ScoreBreakdownProps {
  scores: ScoreBreakdown;
  className?: string;
}

export function ScoreBreakdown({ scores, className = '' }: ScoreBreakdownProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Composition</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">{scores.composition?.toFixed(1) || 'N/A'}/10</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreColorClass(scores.composition || 0)}`}>
              {scoreToGrade(scores.composition || 0)}
            </span>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Emotion</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">{scores.emotion?.toFixed(1) || 'N/A'}/10</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreColorClass(scores.emotion || 0)}`}>
              {scoreToGrade(scores.emotion || 0)}
            </span>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Aesthetic</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">{scores.aesthetic?.toFixed(1) || 'N/A'}/10</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreColorClass(scores.aesthetic || 0)}`}>
              {scoreToGrade(scores.aesthetic || 0)}
            </span>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Social</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">{scores.social?.toFixed(1) || 'N/A'}/10</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreColorClass(scores.social || 0)}`}>
              {scoreToGrade(scores.social || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 text-center">
        <p className="text-xs font-medium text-muted-foreground mb-2">Overall Score</p>
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold">{scores.overall?.toFixed(1) || 'N/A'}</span>
          <span className="text-sm text-muted-foreground ml-2">/10</span>
        </div>
      </div>
    </div>
  );
}