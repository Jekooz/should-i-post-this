export interface AnalysisResult {
  id: string;
  photoId: string;
  aiResponse: string;
  modelUsed: string;
  promptUsed: string;
  composition: string;
  emotion: string;
  aesthetic: string;
  social: string;
  processingTime: number;
  tokenUsage?: number;
  cost?: number;
  fallbackFrom?: string;
  retryCount: number;
  createdAt: Date;
}

export interface ScoreBreakdown {
  composition: number;
  emotion: number;
  aesthetic: number;
  social: number;
  overall: number;
}

export interface ClaudeVisionResponse {
  composition: {
    score: number;
    reasoning: string;
    details: {
      ruleOfThirds: boolean;
      leadingLines: boolean;
      framing: boolean;
      balance: boolean;
      simplicity: boolean;
    };
  };
  emotion: {
    score: number;
    reasoning: string;
    details: {
      facialExpression?: string;
      mood: string;
      intensity: number;
      authenticity: boolean;
    };
  };
  aesthetic: {
    score: number;
    reasoning: string;
    details: {
      lighting: string;
      colorHarmony: boolean;
      sharpness: number;
      contrast: number;
      noise: number;
    };
  };
  social: {
    score: number;
    reasoning: string;
    details: {
      shareability: number;
      engagementPotential: number;
      trendAlignment: number;
      clarity: number;
    };
  };
  category: string;
  tags: string[];
  suggestedCaption?: string;
}

export interface CaptionRequest {
  photoId: string;
  style: 'casual' | 'professional' | 'witty' | 'poetic';
  includeHashtags: boolean;
  includeEmojis: boolean;
  maxLength?: number;
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  emojis: string[];
  charCount: number;
  style: string;
  photoId: string;
}

export interface AnalysisQueueItem {
  photoId: string;
  priority: number;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}