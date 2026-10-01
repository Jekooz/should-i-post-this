'use client';
import { useState, useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload, X, ImageIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { UploadFileResult } from '@/hooks/use-upload';

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<UploadFileResult[]>;
  disabled?: boolean;
  maxFiles?: number;
}

const ACCEPTED_TYPES: Accept = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

export function ImageUploader({ onUpload, disabled, maxFiles = 50 }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lastResults, setLastResults] = useState<UploadFileResult[] | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }
      setLastResults(null);
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    disabled: disabled || isUploading,
    maxFiles,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    try {
      const results = await onUpload(files);
      const ok = results.filter((r) => r.ok).length;
      const failed = results.length - ok;

      if (ok > 0 && failed === 0) {
        toast.success(`${ok} photo${ok === 1 ? '' : 's'} uploaded`);
        setFiles([]);
      } else if (ok > 0 && failed > 0) {
        toast.error(`${ok} uploaded, ${failed} failed — see details below`);
        // Keep only the files that failed so they can be retried.
        const failedNames = new Set(results.filter((r) => !r.ok).map((r) => r.fileName));
        setFiles((prev) => prev.filter((f) => failedNames.has(f.name)));
      } else {
        toast.error('Upload failed — see details below');
      }
      setLastResults(results);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-accent/50',
          (disabled || isUploading) && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} aria-label="Upload photos" />
        <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="mb-1 font-medium">
          {isDragActive ? 'Drop photos here…' : 'Drag & drop photos here, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP, HEIC — up to {maxFiles} files
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {files.length} file{files.length === 1 ? '' : 's'} ready
            </h3>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="rounded text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear all
            </button>
          </div>

          <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border bg-card p-2">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-md bg-accent/60 px-2 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate text-sm">{file.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)}&nbsp;MB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${file.name}`}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden="true" /> Upload{' '}
                {files.length} Photo{files.length === 1 ? '' : 's'}
              </>
            )}
          </button>
        </div>
      )}

      {lastResults && lastResults.some((r) => !r.ok) && (
        <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3" role="alert">
          <p className="text-sm font-medium text-destructive">Some uploads failed</p>
          <ul className="space-y-1">
            {lastResults
              .filter((r) => !r.ok)
              .map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
                  <span className="truncate font-medium text-foreground">{r.fileName}</span>
                  <span className="shrink-0">— {r.error}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {lastResults && lastResults.every((r) => r.ok) && lastResults.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-success" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {lastResults.length} photo{lastResults.length === 1 ? '' : 's'} added to your library
        </p>
      )}
    </div>
  );
}

export default ImageUploader;
