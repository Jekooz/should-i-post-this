'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, MessageSquareText, UploadCloud, RefreshCw } from 'lucide-react';

interface Activity {
  type: 'analysis' | 'caption' | 'upload';
  id: string;
  timestamp: string;
  photo: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
  overallScore?: number;
  caption?: string;
}

interface ActivityData {
  recentActivity: Activity[];
}

const fmtDate = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const typeLabel: Record<Activity['type'], string> = {
  analysis: 'Analyzed',
  caption: 'Caption generated',
  upload: 'Uploaded',
};

export default function ActivityPage() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch activity data');
      const result = await response.json();
      setData({ recentActivity: result.recentActivity ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] py-10">
      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every upload, analysis, and caption in one timeline.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive" title="Could not load activity" description={error} />
        ) : data?.recentActivity && data.recentActivity.length > 0 ? (
          <ol className="space-y-2">
            {data.recentActivity.map((activity) => {
              const Icon =
                activity.type === 'analysis'
                  ? Sparkles
                  : activity.type === 'caption'
                    ? MessageSquareText
                    : UploadCloud;
              return (
                <li key={activity.id}>
                  <Link
                    href={`/photos/${activity.photo.id}`}
                    className="flex items-center gap-4 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={activity.photo.fileUrl || '/placeholder-photo.jpg'}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {activity.photo.fileName || 'Unnamed photo'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {typeLabel[activity.type]}
                        {activity.type === 'analysis' && activity.overallScore != null && (
                          <span className="tabular-nums">· {activity.overallScore.toFixed(1)}</span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{fmtDate.format(new Date(activity.timestamp))}</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <p className="text-sm font-medium">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload and analyze your first photo to see it here.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Analyze a photo
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
