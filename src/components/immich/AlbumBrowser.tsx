'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePhotoStore } from '@/store/photo-store';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function AlbumBrowser() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { addPhotos } = usePhotoStore();

  useEffect(() => {
    async function loadAlbums() {
      try {
        const res = await apiClient.get<any>('/api/immich/albums');
        setAlbums(res.data);
      } catch (e) {
        toast.error('Failed to load Immich albums');
      } finally {
        setLoading(false);
      }
    }
    loadAlbums();
  }, []);

  const loadPhotos = async (albumId: string) => {
    setSelectedAlbum(albumId);
    setLoading(true);
    try {
      const res = await apiClient.get<any>('/api/immich/photos', { albumId });
      setPhotos(res.data);
    } catch (e) {
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const syncAlbum = async () => {
    if (!selectedAlbum) return;
    setSyncing(true);
    try {
      const assetIds = photos.map(p => p.id);
      const res = await apiClient.post<any>('/api/immich/sync', { albumId: selectedAlbum, assetIds });
      addPhotos(photos); // Add them to local store
      toast.success(`Synced ${res.data.syncedCount} photos!`);
    } catch (e) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading && albums.length === 0) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="border rounded-lg p-4 space-y-3 bg-card">
        <h3 className="font-bold mb-4">Immich Albums</h3>
        {albums.map(album => (
          <button
            key={album.id}
            onClick={() => loadPhotos(album.id)}
            className={`w-full text-left p-3 rounded-md transition-colors ${
              selectedAlbum === album.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            <div className="font-medium">{album.name}</div>
            <div className="text-xs opacity-70">{album.photoCount} photos</div>
          </button>
        ))}
      </div>

      <div className="md:col-span-2 border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Album Photos</h3>
          {selectedAlbum && (
            <Button onClick={syncAlbum} disabled={syncing} size="sm">
              {syncing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Sync to Analysis
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>
        ) : photos.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">Select an album to see photos</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map(photo => (
              <div key={photo.id} className="aspect-square rounded bg-muted overflow-hidden relative group">
                <img src={photo.fileUrl} alt={photo.fileName} className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <span className="text-[10px] text-white truncate px-1">{photo.fileName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}