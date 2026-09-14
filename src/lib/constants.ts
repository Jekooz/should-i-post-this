import { CaptionStyle, Caption } from '@/types/caption';
import { Photo } from '@/types/photo';
import { ImmichConnection, ImmichAlbum } from '@/types/immich';

export const APP_NAME = 'Trip Photo Analyzer';
export const APP_DESCRIPTION =
  'AI-powered photo analysis and caption generation for social media posting';

export const MAX_PHOTO_SIZE_MB = 50;
export const MAX_BATCH_SIZE = 50;
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

export const SCORING_WEIGHTS_DEFAULT = {
  aesthetic: 0.3,
  emotion: 0.3,
  social: 0.4,
  composition: 0.3,
};

export const INSTAGRAM_LIMITS = {
  maxCaptionLength: 2200,
  maxHashtags: 30,
  recommendedHashtags: 15,
};

export const AI_MODELS = {
  claude: 'claude-vision',
  openai: 'gpt-4-vision',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export const CAPTION_STYLES: Record<
  CaptionStyle,
  { label: string; description: string; icon: string }
> = {
  casual: {
    label: 'Casual',
    description: 'Relaxed, friendly tone like talking to friends',
    icon: '😊',
  },
  professional: {
    label: 'Professional',
    description: 'Polished, brand-appropriate tone for business',
    icon: '💼',
  },
  witty: {
    label: 'Witty',
    description: 'Clever, humorous with wordplay and personality',
    icon: '😏',
  },
  poetic: {
    label: 'Poetic',
    description: 'Artistic, evocative, and emotionally resonant',
    icon: '✨',
  },
};

export const PHOTO_CATEGORIES = {
  landscape: { label: 'Landscape', icon: '🏞️', color: 'bg-green-100 text-green-800' },
  portrait: { label: 'Portrait', icon: '👤', color: 'bg-blue-100 text-blue-800' },
  group: { label: 'Group', icon: '👥', color: 'bg-purple-100 text-purple-800' },
  food: { label: 'Food', icon: '🍕', color: 'bg-orange-100 text-orange-800' },
  architecture: { label: 'Architecture', icon: '🏛️', color: 'bg-gray-100 text-gray-800' },
  wildlife: { label: 'Wildlife', icon: '🦁', color: 'bg-yellow-100 text-yellow-800' },
  street: { label: 'Street', icon: '🏙️', color: 'bg-indigo-100 text-indigo-800' },
  action: { label: 'Action', icon: '🏃', color: 'bg-red-100 text-red-800' },
  food_art: { label: 'Food Art', icon: '🎨', color: 'bg-pink-100 text-pink-800' },
  other: { label: 'Other', icon: '📷', color: 'bg-gray-100 text-gray-800' },
};

export const IMMICH_DEFAULT_SETTINGS = {
  timeout: 10000,
  batchSize: 20,
  thumbnailSize: 300,
};

export const CACHE_CONFIG = {
  analysisCacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  thumbnailCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 100 * 1024 * 1024, // 100MB
};

export const RATE_LIMITS = {
  claude: {
    requestsPerMinute: 3,
    tokensPerMinute: 100000,
  },
  openai: {
    requestsPerMinute: 10,
    tokensPerMinute: 150000,
  },
};

export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  ANALYZE: '/api/analyze',
  CAPTIONS: '/api/captions',
  IMMICH: {
    CONNECT: '/api/immich/connect',
    ALBUMS: '/api/immich/albums',
    PHOTOS: '/api/immich/photos',
    SYNC: '/api/immich/sync',
    STATUS: '/api/immich/status',
  },
  PHOTOS: '/api/photos',
  SETTINGS: '/api/settings',
} as const;