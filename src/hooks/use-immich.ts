'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function useImmich() {
  const [status, setStatus] = useState<'connected' | 'error' | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);

  const connect = async (data: { serverUrl: string; apiKey?: string }) => {
    try {
      await apiClient.post('/api/immich', data);
      setStatus('connected');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
      throw err;
    }
  };

  return { status, connect, error } as const;
}
