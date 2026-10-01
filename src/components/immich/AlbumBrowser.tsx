'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiClient, APIError } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Loader2, FolderOpen, RefreshCw, Download, ServerOff } from 'lucide-react';

interface Album {
  id: string;
  name: string;
  photoCount: number;
}

interface AlbumPhoto {
  id: string;
  fileName: string;
  thumbnailUrl?: string;
  fileUrl?: string;
}

export function AlbumBrowser({ onSynced }: { onSynced?: () => void }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadAlbums = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<{ success: boolean; data: Album[] }>('/api/immich/albums');
      setAlbums(res.data ?? []);
    } catch (e) {
      setAlbums([]);
      if (e instanceof APIError) {
        const msg = e.message || '';
        const invalidKey = e.status === 401 || /401|invalid api key/i.test(msg);
        const notConfigured = e.status === 400 || /not configured/i.test(msg);
        setLoadError(
          invalidKey
            ? 'Immich rejected the API key. Generate a new key in Immich (User Settings → API Keys) and update IMMICH_API_KEY in .env.local, then restart the server.'
            : notConfigured
              ? 'Immich is not configured. Set IMMICH_URL and IMMICH_API_KEY in .env.local or connect below.'
              : msg || 'The Immich server returned an error.'
        );
      } else {
        setLoadError('Could not reach the Immich server.');
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const loadPhotos = async (albumId: string) => {
    setSelectedAlbum(albumId);
    setPhotosLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: AlbumPhoto[] }>(
        '/api/immich/photos',
        { albumId }
      );
      setPhotos(res.data ?? []);
    } catch {
      toast.error('Failed to load album photos');
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  const syncAlbum = async () => {
    if (!selectedAlbum || syncing) return;
    setSyncing(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: { syncedCount: number } }>(
        '/api/immich/sync',
        { albumId: selectedAlbum }
      );
      const count = res.data?.syncedCount ?? 0;
      toast.success(`Synced ${count} photo${count === 1 ? '' : 's'}`);
      onSynced?.();
    } catch (e) {
      const msg =
        e instanceof APIError && e.status === 401
          ? 'Immich rejected the API key — update IMMICH_API_KEY.'
          : 'Sync failed. Check the Immich server and try again.';
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed p-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Connecting to Immich…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive" title="Immich is unavailable" description={loadError} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAlbums}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/settings')}>
            Open Settings
          </Button>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ServerOff className="h-3.5 w-3.5" aria-hidden="true" />
          Not using Immich? Skip this section and upload photos directly.
        </p>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <FolderOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Connected, but no albums found on your Immich server.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-card p-3">
        <h3 className="mb-2 px-1 text-sm font-semibold">Albums</h3>
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {albums.map((album) => (
            <li key={album.id}>
              <button
                type="button"
                onClick={() => loadPhotos(album.id)}
                aria-pressed={selectedAlbum === album.id}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedAlbum === album.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <span className="block truncate text-sm font-medium">{album.name}</span>
                <span
                  className={`block text-xs tabular-nums ${
                    selectedAlbum === album.id ? 'opacity-80' : 'text-muted-foreground'
                  }`}
                >
                  {album.photoCount} photo{album.photoCount === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border bg-card p-3 md:col-span-2">
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold">Album Photos</h3>
          {selectedAlbum && (
            <Button onClick={syncAlbum} disabled={syncing || photosLoading} size="sm">
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Import
            </Button>
          )}
        </div>

        {photosLoading ? (
          <div className="flex items-center justify-center p-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Loading photos…
          </div>
        ) : photos.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {selectedAlbum ? 'This album has no photos.' : 'Select an album to preview its photos.'}
          </div>
        ) : (
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={photo.thumbnailUrl || photo.fileUrl || ''}
                  alt={photo.fileName}
                  width={200}
                  height={200}
                  unoptimized
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="truncate text-[10px] text-white">{photo.fileName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
