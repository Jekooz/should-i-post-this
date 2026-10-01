'use client';

import { useCallback, useEffect, useState } from 'react';
import ImageUploader from '@/components/gallery/ImageUploader';
import { ImmichConnect } from '@/components/immich/ImmichConnect';
import { AlbumBrowser } from '@/components/immich/AlbumBrowser';
import { CaptionGenerator } from '@/components/caption/CaptionGenerator';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/analysis/ScoreRing';
import { Loader2, Sparkles, RefreshCw, Check, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { UploadFileResult } from '@/hooks/use-upload';

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

  const handleUpload = async (files: File[]): Promise<UploadFileResult[]> => {
    const results: UploadFileResult[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          results.push({ fileName: file.name, ok: false, error: json?.error || `HTTP ${res.status}` });
        } else {
          results.push({ fileName: file.name, ok: true, photoId: json.data?.id });
        }
      } catch (e) {
        results.push({
          fileName: file.name,
          ok: false,
          error: e instanceof Error ? e.message : 'Network error',
        });
      }
    }

    // Refresh the library if anything made it in.
    if (results.some((r) => r.ok)) {
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
      toast.success('Photo analyzed');
      await loadPhotos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzingId(null);
    }
  };

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) ?? null;

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Find your best shots
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Upload trip photos, get AI scores across composition, emotion, aesthetic, and social appeal —
            then generate captions worth posting.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section aria-labelledby="upload-heading" className="space-y-4">
              <h2 id="upload-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Add Photos
              </h2>
              <ImageUploader onUpload={handleUpload} />
            </section>

            <section aria-labelledby="immich-heading" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="immich-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Immich Server
                </h2>
              </div>
              <ImmichConnect onConnected={loadPhotos} />
              <AlbumBrowser onSynced={loadPhotos} />
            </section>

            <section aria-labelledby="library-heading" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="library-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Your Library
                  {photos.length > 0 && (
                    <span className="ml-2 font-normal normal-case tabular-nums text-muted-foreground">
                      {photos.length}
                    </span>
                  )}
                </h2>
                <Button variant="ghost" size="sm" onClick={loadPhotos}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
                </Button>
              </div>

              {loadingPhotos ? (
                <div className="flex justify-center rounded-xl border border-dashed p-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Loading photos</span>
                </div>
              ) : photos.length === 0 ? (
                <div className="rounded-xl border border-dashed p-16 text-center">
                  <UploadCloud className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">No photos yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload photos above or import from Immich to get started.
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo) => {
                    const isSelected = selectedPhotoId === photo.id;
                    return (
                      <li key={photo.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoId(isSelected ? null : photo.id)}
                          aria-pressed={isSelected}
                          className={cn(
                            'group relative block w-full overflow-hidden rounded-xl border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            isSelected ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-border'
                          )}
                        >
                          <span className="block aspect-square">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.fileUrl}
                              alt={photo.fileName}
                              width={400}
                              height={400}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </span>
                          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span className="truncate text-xs text-white">{photo.fileName}</span>
                            {photo.overallScore != null && (
                              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary-foreground">
                                {photo.overallScore.toFixed(1)}
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            </span>
                          )}
                          {photo.source === 'immich' && (
                            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                              Immich
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border bg-card p-6 lg:sticky lg:top-20">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedPhoto ? 'Selected Photo' : 'Quick Analysis'}
              </h2>
              {!selectedPhoto ? (
                <div className="py-6 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Select a photo from your library to analyze it with AI.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPhoto.fileUrl}
                      alt={selectedPhoto.fileName}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{selectedPhoto.fileName}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {selectedPhoto.category || 'Uncategorized'} · {selectedPhoto.source}
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
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Analyzing…
                      </>
                    ) : selectedPhoto.analyzed ? (
                      <>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Re-analyze
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden="true" /> Analyze with AI
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/photos/${selectedPhoto.id}`}
                    className="block rounded text-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    View full details
                  </Link>
                </div>
              )}
            </div>

            <CaptionGenerator photos={photos} selectedPhotoId={selectedPhotoId} />
          </aside>
        </div>
      </div>
    </main>
  );
}
