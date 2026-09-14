export type CaptionStyle = 'casual' | 'professional' | 'witty' | 'poetic';

export interface Caption {
  id: string;
  photoId: string;
  style: CaptionStyle;
  caption: string;
  hashtags: string[];
  emojis: string[];
  charCount: number;
  isOptimal: boolean;
  suggestionOrder: number;
  createdAt: Date;
}

export interface CaptionGenerationRequest {
  photoId: string;
  analysisResult?: {
    category?: string;
    tags?: string[];
    scores: {
      composition: number;
      emotion: number;
      aesthetic: number;
      social: number;
      overall: number;
    };
  };
  style: CaptionStyle;
  includeHashtags: boolean;
  includeEmojis: boolean;
  maxLength?: number;
  userPreferences?: {
    tone?: string;
    avoidWords?: string[];
    preferredHashtags?: string[];
  };
}

export interface CaptionGenerationResponse {
  captions: Caption[];
  optimalCaption: Caption;
}

export const CAPTION_STYLES: Record<CaptionStyle, { label: string; description: string }> = {
  casual: {
    label: 'Casual',
    description: 'Relaxed, friendly tone like talking to friends',
  },
  professional: {
    label: 'Professional',
    description: 'Polished, brand-appropriate tone for business',
  },
  witty: {
    label: 'Witty',
    description: 'Clever, humorous with wordplay and personality',
  },
  poetic: {
    label: 'Poetic',
    description: 'Artistic, evocative, and emotionally resonant',
  },
};

export const INSTAGRAM_MAX_LENGTH = 2200;
export const MAX_HASHTAGS = 30;
export const RECOMMENDED_HASHTAGS = 15;