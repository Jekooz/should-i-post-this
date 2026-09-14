'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CaptionPreviewProps {
  caption: string;
  hashtags: string[];
  emojis: string[];
  onUpdateCaption: (val: string) => void;
}

export function CaptionPreview({ caption, hashtags, emojis, onUpdateCaption }: CaptionPreviewProps) {
  const [copied, setCopied] = useState(false);

  const fullText = `${caption}\n\n${hashtags.map(h => `#${h.replace('#', '')}`).join(' ')} ${emojis.join(' ')}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Instagram Preview</span>
        <Button onClick={copyToClipboard} size="sm" variant="outline">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="p-4 rounded-lg bg-muted border min-h-[100px] whitespace-pre-wrap text-sm leading-relaxed">
        {caption}
        <br /><br />
        <span className="text-blue-500">{hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}</span>
        <span className="ml-2">{emojis.join(' ')}</span>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {fullText.length} / 2,200 characters
      </div>
    </div>
  );
}