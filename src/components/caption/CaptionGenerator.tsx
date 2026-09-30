'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { CaptionPreview } from './CaptionPreview';

interface PhotoItem {
  id: string;
  fileName: string;
}

interface CaptionResult {
  caption: string;
  hashtags: string[];
  emojis: string[];
}

interface CaptionGeneratorProps {
  photos: PhotoItem[];
  selectedPhotoId: string | null;
}

const STYLES = ['casual', 'professional', 'witty', 'poetic'] as const;

export function CaptionGenerator({ photos, selectedPhotoId }: CaptionGeneratorProps) {
  const [style, setStyle] = useState<string>('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<Record<string, CaptionResult>>({});

  const photo = photos.find((p) => p.id === selectedPhotoId) ?? null;

  if (!photo) {
    return (
      <div className="p-8 text-center border rounded-lg text-muted-foreground">
        Select a photo to generate captions
      </div>
    );
  }

  const generate = async () => {
    setIsGenerating(true);
    try {
      const res = await apiClient.post<{
        success: boolean;
        data: { caption: string; hashtags: string[]; emojis: string[] };
      }>('/api/captions', { photoId: photo.id, style });
      setCaptions((prev) => ({
        ...prev,
        [photo.id]: {
          caption: res.data.caption,
          hashtags: res.data.hashtags || [],
          emojis: res.data.emojis || [],
        },
      }));
      toast.success('Caption generated!');
    } catch {
      toast.error('Failed to generate caption');
    } finally {
      setIsGenerating(false);
    }
  };

  const caption = captions[photo.id];

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Caption Generator
        </h2>
      </div>

      <p className="text-sm text-muted-foreground truncate">{photo.fileName}</p>

      <div className="flex gap-2 flex-wrap">
        {STYLES.map((s) => (
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

      <Button onClick={generate} disabled={isGenerating} className="w-full">
        {isGenerating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
        Generate {style} caption
      </Button>

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
}
