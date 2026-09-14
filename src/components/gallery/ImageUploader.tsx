'use client';
import { useState, useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<any[]>;
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }
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
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(files);
      toast.success(`${files.length} photo(s) uploaded successfully`);
      setFiles([]);
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:bg-accent'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-1">
          {isDragActive ? 'Drop your photos here...' : 'Drag & drop photos here'}
        </p>
        <p className="text-sm text-muted-foreground">
          or click to select files
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Supports JPG, PNG, WebP, HEIC — Max {maxFiles} files
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{files.length} file(s) ready to upload</h3>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-3 p-2 rounded bg-accent"
              >
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="p-1 hover:bg-background rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload {files.length} Photo(s)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
