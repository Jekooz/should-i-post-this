'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usePhotoStore } from '@/store/photo-store';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { CaptionPreview } from './CaptionPreview';

export function CaptionGenerator() {
  const { selectedPhotos, selectedPhotoIds } = usePhotoStore();
  const [style, setStyle] = useState('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<Record<string, any>>({});

  if (selectedPhotoIds.length === 0) {
    return <div className="p-8 text-center border rounded-lg text-muted-foreground">Select a photo to generate captions</div>;
  }

  const generateForSelected = async () => {
    setIsGenerating(true);
    try {
      const results: Record<string, any> = {};
      for (const id of selectedPhotoIds) {
        const res = await apiClient.post<any>('/api/captions', { photoId: id, style });
        results[id] = res.data;
      }
      setGeneratedCaptions(results);
      toast.success('Captions generated!');
    } catch (e) {
      toast.error('Failed to generate captions');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Caption Generator
        </h2>
        <div className="flex gap-2">
          {['casual', 'professional', 'witty', 'poetic'].map(s => (
            <Button
              key={s}
              variant={style === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStyle(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Button
        onClick={generateForSelected}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
        Generate Captions for {selectedPhotoIds.length} Photo(s)
      </Button>

      <div className="space-y-8">
        {selectedPhotoIds.map(id => {
          const photo = usePhotoStore.getState().photos.find(p => p.id === id);
          const caption = generatedCaptions[id];
          return (
            <div key={id} className="space-y-3">
              <h3 className="font-medium text-sm">{photo?.fileName}</h3>
              {caption ? (
                <CaptionPreview
                  caption={caption.caption}
                  hashtags={caption.hashtags}
                  emojis={caption.emojis}
                  onUpdateCaption={() => {}}
                />
              ) : (
                <div className="p-8 text-center border rounded-lg text-xs text-muted-foreground bg-muted/30">
                  No caption generated yet
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}