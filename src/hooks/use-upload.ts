'use client';
import { useState, useCallback } from 'react';

export interface UploadProgress {
  progress: number;
  total: number;
  completed: number;
  failed: number;
  uploading: number;
  currentFile?: string;
}

export interface UseUploadResult {
  uploadFiles: (files: File[]) => Promise<any[]>;
  uploadProgress: UploadProgress;
  isUploading: boolean;
  error: string | null;
  uploadedPhotos: any[];
  reset: () => void;
}

export function useUpload(): UseUploadResult {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    total: 0,
    completed: 0,
    failed: 0,
    uploading: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);

  const reset = useCallback(() => {
    setUploadProgress({
      progress: 0,
      total: 0,
      completed: 0,
      failed: 0,
      uploading: 0,
    });
    setIsUploading(false);
    setError(null);
    setUploadedPhotos([]);
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<any[]> => {
    if (files.length === 0) {
      return [];
    }

    setIsUploading(true);
    setError(null);
    setUploadedPhotos([]);
    setUploadProgress({
      progress: 0,
      total: files.length,
      completed: 0,
      failed: 0,
      uploading: 0,
    });

    const results: any[] = [];
    let completed = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileProgress: UploadProgress = {
        progress: ((i + 1) / files.length) * 100,
        total: files.length,
        completed,
        failed,
        uploading: 1,
        currentFile: file.name,
      };
      setUploadProgress(fileProgress);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}: ${response.statusText}`);
        }

        const result = await response.json();
        results.push(result.data);
        setUploadedPhotos((prev) => [...prev, result.data]);
        completed++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        failed++;
      }

      setUploadProgress({
        progress: ((i + 1) / files.length) * 100,
        total: files.length,
        completed,
        failed,
        uploading: i < files.length - 1 ? 1 : 0,
      });
    }

    setIsUploading(false);

    if (failed > 0) {
      setError(`${failed} file(s) failed to upload`);
    }

    return results;
  }, []);

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    error,
    uploadedPhotos,
    reset,
  };
}