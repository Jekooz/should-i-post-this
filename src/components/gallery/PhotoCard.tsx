'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Photo } from '@/types/photo';
import { ScoreRing } from '@/components/analysis/ScoreRing';
import { usePhotoStore } from '@/store/photo-store';
import toast from 'react-hot-toast';

interface PhotoCardProps {
  photo: Photo;
  className?: string;
}

export function PhotoCard({ photo, className = '' }: PhotoCardProps) {
  const { selectedPhotoIds, togglePhotoSelection } = usePhotoStore();
  const isSelected = selectedPhotoIds.includes(photo.id);

  const handleSelect = () => {
    togglePhotoSelection(photo.id);
    toast(isSelected ? 'Photo deselected' : 'Photo selected');
  };

  return (
    <Link href={`/gallery/${photo.id}`} className={className}>
      <article className="group flex flex-col h-full border rounded-lg overflow-hidden hover:border-primary transition-all">
        <div className="relative aspect-w-16 aspect-h-9">
          <Image
            src={photo.fileUrl}
            alt={photo.fileName}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <div className="w-full space-x-2">
              <ScoreRing score={photo.overallScore || 0} size={48} strokeWidth={4} className="self-start" />
              <div className="text-left text-sm space-y-1">
                <h3 className="font-semibold text-white line-clamp-2">{photo.fileName}</h3>
                <p className="text-xs text-white/80">
                  {photo.category ? (photo.category.charAt(0).toUpperCase() + photo.category.slice(1)) : 'Uncategorized'}
                </p>
                {photo.dateTaken && (
                  <p className="text-xs text-white/70">
                    {new Date(photo.dateTaken).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground">{photo.fileName}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect();
              }}
              className={`p-1 rounded-full transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-accent'
              }`}
            >
              {isSelected ? '✓' : '○'}
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="mr-2">Score:</span>
              <ScoreRing score={photo.overallScore || 0} size={24} strokeWidth={2} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Composition:</div>
              <span>{(photo.compositionScore || 0).toFixed(1)}</span>
              <div>Emotion:</div>
              <span>{(photo.emotionScore || 0).toFixed(1)}</span>
              <div>Aesthetic:</div>
              <span>{(photo.aestheticScore || 0).toFixed(1)}</span>
              <div>Social:</div>
              <span>{(photo.socialScore || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}