'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CaptionPreviewProps {
  caption: string;
  hashtags: string[];
  emojis: string[];
  onUpdateCaption: (val: string) => void;
}

export function CaptionPreview({ caption, hashtags, emojis }: CaptionPreviewProps) {
  const [copied, setCopied] = useState(false);

  const fullText = `${caption}\n\n${hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')} ${emojis.join(' ')}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Instagram Preview
        </span>
        <Button onClick={copyToClipboard} size="sm" variant="outline">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="min-h-[100px] whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
        {caption}
        {'\n\n'}
        <span className="text-primary">{hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}</span>
        <span className="ml-2">{emojis.join(' ')}</span>
      </div>
      <div className="text-right text-xs tabular-nums text-muted-foreground">
        {fullText.length.toLocaleString()} / 2,200 characters
      </div>
    </div>
  );
}
