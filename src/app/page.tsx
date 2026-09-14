'use client';

import ImageUploader from '@/components/gallery/ImageUploader';
import { PhotoGrid } from '@/components/gallery/PhotoGrid';
import { ImmichConnect } from '@/components/immich/ImmichConnect';
import { AlbumBrowser } from '@/components/immich/AlbumBrowser';
import { CaptionGenerator } from '@/components/caption/CaptionGenerator';
import { usePhotoStore, usePhotoSelectors } from '@/store/photo-store';
import { useUpload } from '@/hooks/use-upload';

export default function Home() {
  const { filteredPhotos, hasPhotos } = usePhotoSelectors();
  const { uploadFiles } = useUpload();

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Trip Photo Analyzer</h1>
        <p className="text-muted-foreground mb-8">
          Upload your trip photos and let AI analyze them to find the best ones to post with engaging captions.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Manual Upload</h2>
                <ImageUploader onUpload={uploadFiles} />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Immich Server</h2>
                <ImmichConnect />
                <AlbumBrowser />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Photos</h2>
              <PhotoGrid photos={filteredPhotos} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-4">Quick Analysis</h2>
              {!hasPhotos ? (
                <p className="text-muted-foreground">Upload photos to see analysis results</p>
              ) : (
                <div className="space-y-4">
                  {filteredPhotos.slice(0, 5).map((photo) => (
                    <div key={photo.id} className="border rounded p-3">
                      <p className="font-medium text-sm">{photo.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {photo.overallScore?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CaptionGenerator />
          </div>
        </div>
      </div>
    </main>
  );
}
