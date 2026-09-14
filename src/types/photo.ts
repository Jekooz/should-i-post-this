export interface Photo {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  dateTaken?: Date;
  cameraModel?: string;
  location?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  altitude?: number;
  overallScore?: number;
  aestheticScore?: number;
  emotionScore?: number;
  socialScore?: number;
  compositionScore?: number;
  category?: string;
  tags?: string[];
  source?: 'manual' | 'immich';
  immichAssetId?: string;
  immichAlbumId?: string;
  analyzed?: boolean;
  analyzedAt?: Date;
  inBatch?: boolean;
  selected?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PhotoUpload {
  fileName: string;
  fileSize: number;
  mimeType: string;
  file: File;
}

export interface PhotoFilters {
  minScore?: number;
  maxScore?: number;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  source?: 'manual' | 'immich';
  sortBy?: 'score' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_BATCH_SIZE = 50;