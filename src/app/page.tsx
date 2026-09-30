'use client';

import { useCallback, useEffect, useState } from 'react';
import ImageUploader from '@/components/gallery/ImageUploader';
import { ImmichConnect } from '@/components/immich/ImmichConnect';
import { AlbumBrowser } from '@/components/immich/AlbumBrowser';
import { CaptionGenerator } from '@/components/caption/CaptionGenerator';
import { usePhotoStore } from '@/store/photo-store';
import { useUpload } from '@/hooks/use-upload';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/analysis/ScoreRing';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PhotoItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  overallScore?: number;
  category?: string;
  source: 'manual' | 'immich';
  analyzed: boolean;
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const { uploadFiles, isUploading } = useUpload();

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      const json = await res.json();
      if (json.success) {
        setPhotos(json.data);
      }
    } catch {
      toast.error('Failed to load photos');
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleUpload = async (files: File[]) => {
    const results = await uploadFiles(files);
    if (results.length > 0) {
      await loadPhotos();
    }
    return results;
  };

  const analyzePhoto = async (photoId: string) => {
    setAnalyzingId(photoId);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, type: 'full', style: 'casual' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Analysis failed');
      toast.success('Photo analyzed!');
      await loadPhotos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzingId(null);
    }
  };

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) ?? null;

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
                <ImageUploader onUpload={handleUpload} />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Immich Server</h2>
                <ImmichConnect onConnected={loadPhotos} />
                <AlbumBrowser onSynced={loadPhotos} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Photos</h2>
                <Button variant="ghost" size="sm" onClick={loadPhotos}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </div>
              {loadingPhotos ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No photos yet. Upload some to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedPhotoId === photo.id
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-transparent hover:border-border'
                      }`}
                      onClick={() => setSelectedPhotoId(photo.id)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.fileUrl}
                        alt={photo.fileName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 flex items-center justify-between gap-2">
                        <span className="text-white text-xs truncate">{photo.fileName}</span>
                        {photo.overallScore != null && (
                          <span className="bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full text-[10px] shrink-0">
                            {photo.overallScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {photo.source === 'immich' && (
                        <span className="absolute top-2 left-2 bg-muted/90 text-foreground text-[10px] px-2 py-0.5 rounded-full">
                          Immich
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-4">
                {selectedPhoto ? 'Analyze Photo' : 'Quick Analysis'}
              </h2>
              {!selectedPhoto ? (
                <p className="text-muted-foreground">Select a photo to analyze it with AI.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPhoto.fileUrl}
                      alt={selectedPhoto.fileName}
                      className="h-16 w-16 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{selectedPhoto.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPhoto.category || 'Uncategorized'} • {selectedPhoto.source}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center py-2">
                    <ScoreRing score={selectedPhoto.overallScore ?? 0} size={110} />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => analyzePhoto(selectedPhoto.id)}
                    disabled={analyzingId === selectedPhoto.id}
                  >
                    {analyzingId === selectedPhoto.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…
                      </>
                    ) : selectedPhoto.analyzed ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" /> Re-analyze
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" /> Analyze with AI
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/photos/${selectedPhoto.id}`}
                    className="block text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    View full details
                  </Link>
                </div>
              )}
            </div>

            <CaptionGenerator photos={photos} selectedPhotoId={selectedPhotoId} />
          </div>
        </div>
      </div>
    </main>
  );
}
