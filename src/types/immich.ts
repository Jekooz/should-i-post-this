export interface ImmichAlbum {
  id: string;
  albumName: string;
  albumThumbnailAssetId?: string;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImmichAsset {
  id: string;
  originalFileName: string;
  originalFileNameWithPath?: string;
  type: 'IMAGE' | 'VIDEO';
  width: number;
  height: number;
  fileSize: number;
  fileModifiedAt: string;
  dateTimeOriginal?: string;
  deviceMake?: string;
  deviceModel?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  exifInfo?: {
    cameraMake?: string;
    cameraModel?: string;
    exposureTime?: string;
    apertureValue?: number;
    focalLength?: number;
    iso?: number;
    dateTimeOriginal?: string;
  };
  livePhotoVideoId?: string;
  isReadOnly?: boolean;
  isOffline?: boolean;
  fileCreatedAt: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  stackParentAssetId?: string;
  duration?: string;
  isTrashed?: boolean;
  idInAlbum?: string;
}

export interface ImmichConnection {
  serverUrl: string;
  apiKey?: string;
  connected: boolean;
  status: 'idle' | 'connected' | 'syncing' | 'error';
  error?: string;
  lastSync?: Date;
  albumsCount?: number;
  photosCount?: number;
}

export interface ImmichSyncResult {
  syncId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalPhotos: number;
  processedPhotos: number;
  failedPhotos: number;
  albumsProcessed: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface ImmichConnectionConfig {
  serverUrl: string;
  apiKey?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  albumsToSync?: string[];
  includeArchived?: boolean;
}
