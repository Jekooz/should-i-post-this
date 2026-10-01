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

export interface UploadFileResult {
  fileName: string;
  ok: boolean;
  photoId?: string;
  error?: string;
}

export interface UseUploadResult {
  uploadFiles: (files: File[]) => Promise<UploadFileResult[]>;
  uploadProgress: UploadProgress;
  isUploading: boolean;
  error: string | null;
  uploadedPhotos: unknown[];
  reset: () => void;
}

interface UploadApiResponse {
  success: boolean;
  data?: { id?: string };
  error?: string;
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
  const [uploadedPhotos, setUploadedPhotos] = useState<unknown[]>([]);

  const reset = useCallback(() => {
    setUploadProgress({ progress: 0, total: 0, completed: 0, failed: 0, uploading: 0 });
    setIsUploading(false);
    setError(null);
    setUploadedPhotos([]);
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadFileResult[]> => {
    if (files.length === 0) return [];

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

    const results: UploadFileResult[] = [];
    const okPhotos: unknown[] = [];
    let completed = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({
        progress: Math.round(((i + 1) / files.length) * 100),
        total: files.length,
        completed,
        failed,
        uploading: 1,
        currentFile: file.name,
      });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = (await response.json().catch(() => null)) as UploadApiResponse | null;

        if (!response.ok || !result?.success) {
          const message = result?.error || `HTTP ${response.status}`;
          results.push({ fileName: file.name, ok: false, error: message });
          failed++;
        } else {
          results.push({ fileName: file.name, ok: true, photoId: result.data?.id });
          if (result.data) okPhotos.push(result.data);
          completed++;
        }
      } catch (err) {
        results.push({
          fileName: file.name,
          ok: false,
          error: err instanceof Error ? err.message : 'Network error',
        });
        failed++;
      }

      setUploadProgress({
        progress: Math.round(((i + 1) / files.length) * 100),
        total: files.length,
        completed,
        failed,
        uploading: i < files.length - 1 ? 1 : 0,
      });
    }

    setUploadedPhotos(okPhotos);
    setIsUploading(false);
    if (failed > 0) {
      setError(`${failed} of ${files.length} file(s) failed to upload`);
    }

    return results;
  }, []);

  return { uploadFiles, uploadProgress, isUploading, error, uploadedPhotos, reset };
}
