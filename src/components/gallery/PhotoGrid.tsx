'use client';

import { Photo } from '@/types/photo';
import Image from 'next/image';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
  onPhotoSelect?: (photoId: string) => void;
  selectedPhotos?: string[];
  loading?: boolean;
}

export function PhotoGrid({ photos, onPhotoClick, onPhotoSelect, selectedPhotos, loading }: PhotoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <p className="text-muted-foreground">No photos yet. Upload some to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
            selectedPhotos?.includes(photo.id) ? 'border-primary ring-2 ring-primary' : 'border-transparent'
          }`}
          onClick={() => onPhotoClick?.(photo)}
        >
          <div className="relative w-full h-full group">
            <Image
              src={photo.fileUrl}
              alt={photo.fileName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <div className="text-white text-xs">
                <p className="font-medium truncate">{photo.fileName}</p>
                {photo.overallScore && (
                  <span className="bg-primary/80 px-2 py-0.5 rounded-full text-[10px]">
                    Score: {photo.overallScore.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            {selectedPhotos?.includes(photo.id) && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}