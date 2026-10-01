'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Images,
  Sparkles,
  TrendingUp,
  Star,
  MessageSquareText,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';

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

interface ImmichStatus {
  serverUrl: string;
  lastSyncedAt: string | null;
  albumsCount: number | null;
  photosCount: number | null;
  status: string;
}

interface DashboardData {
  totalPhotoCount: number;
  analyzedPhotoCount: number;
  averageOverallScore: number;
  topPicksCount: number;
  recentActivity: Activity[];
  immichSync: ImmichStatus | null;
}

const fmtDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const fmtDateTime = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  delay,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
      <span className="sr-only">{delay}</span>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReSync = async () => {
    try {
      const response = await fetch('/api/immich?endpoint=sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to start re-sync');
      toast.success('Re-sync started');
      setTimeout(fetchData, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start re-sync');
    }
  };

  const activityIcon = (type: Activity['type']) =>
    type === 'analysis' ? Sparkles : type === 'caption' ? MessageSquareText : UploadCloud;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] py-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Photo analytics, Immich sync status, and recent activity.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" passHref legacyBehavior>
              <Button asChild variant="outline" className="shadow-sm">
                <a>
                  <Images className="h-4 w-4" aria-hidden="true" />
                  Analyze Photos
                </a>
              </Button>
            </Link>
            <Link href="/settings" passHref legacyBehavior>
              <Button asChild className="shadow-sm">
                <a>Settings</a>
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="mb-2 h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </>
        ) : error ? (
          <>
            <Alert variant="destructive" title="Could not load the dashboard" description={error} />
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try Again
            </Button>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Photos"
                value={(data?.totalPhotoCount ?? 0).toLocaleString()}
                hint={
                  data?.totalPhotoCount
                    ? `${data.analyzedPhotoCount} analyzed`
                    : 'No photos yet'
                }
                icon={Images}
                delay={0}
              />
              <StatCard
                title="Analyzed"
                value={(data?.analyzedPhotoCount ?? 0).toLocaleString()}
                hint={
                  data?.totalPhotoCount
                    ? `${Math.round(((data.analyzedPhotoCount / data.totalPhotoCount) * 100))}% of library`
                    : 'Run an analysis to see stats'
                }
                icon={Sparkles}
                delay={0}
              />
              <StatCard
                title="Average Score"
                value={(data?.averageOverallScore ?? 0).toFixed(1)}
                hint={data?.analyzedPhotoCount ? 'Across analyzed photos' : 'No analyzed photos'}
                icon={TrendingUp}
                delay={0}
              />
              <StatCard
                title="Top Picks"
                value={(data?.topPicksCount ?? 0).toLocaleString()}
                hint="Score ≥ 9.0"
                icon={Star}
                delay={0}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Uploads, analyses, and generated captions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {data?.recentActivity && data.recentActivity.length > 0 ? (
                    data.recentActivity.map((activity) => {
                      const Icon = activityIcon(activity.type);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                              <Image
                                src={activity.photo.fileUrl || '/placeholder-photo.jpg'}
                                alt=""
                                width={40}
                                height={40}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {activity.photo.fileName || 'Unnamed photo'}
                              </p>
                              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Icon className="h-3 w-3" aria-hidden="true" />
                                {activity.type === 'analysis'
                                  ? `Analyzed · score ${activity.overallScore?.toFixed(1) ?? '—'}`
                                  : activity.type === 'caption'
                                    ? 'Caption generated'
                                    : 'Uploaded'}
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{fmtDate.format(new Date(activity.timestamp))}</span>
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/photos/${activity.photo.id}`}
                            className="shrink-0 rounded text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            View
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No activity yet — upload and analyze your first photo.
                    </div>
                  )}
                </CardContent>
                {data?.recentActivity && data.recentActivity.length >= 5 && (
                  <div className="border-t px-6 py-3">
                    <Link
                      href="/activity"
                      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      View all activity →
                    </Link>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Immich Status</CardTitle>
                  <CardDescription>Connection and sync details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data?.immichSync ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            data.immichSync.status === 'connected'
                              ? 'bg-success'
                              : data.immichSync.status === 'syncing'
                                ? 'bg-amber-500'
                                : 'bg-destructive'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium capitalize">{data.immichSync.status}</span>
                      </div>
                      <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">Last sync</dt>
                          <dd className="tabular-nums">
                            {data.immichSync.lastSyncedAt
                              ? fmtDateTime.format(new Date(data.immichSync.lastSyncedAt))
                              : 'Never'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">Photos synced</dt>
                          <dd className="tabular-nums">{(data.immichSync.photosCount ?? 0).toLocaleString()}</dd>
                        </div>
                      </dl>
                    </>
                  ) : (
                    <p className="py-2 text-sm text-muted-foreground">
                      Not connected. Add your Immich URL and API key in settings.
                    </p>
                  )}

                  <div className="space-y-2 pt-2">
                    {data?.immichSync && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleReSync}
                        disabled={data.immichSync.status === 'syncing'}
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        {data.immichSync.status === 'syncing' ? 'Syncing…' : 'Re-sync Now'}
                      </Button>
                    )}
                    <Link href="/settings" passHref legacyBehavior>
                      <Button asChild variant="ghost" className="w-full">
                        <a>Manage Connection</a>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
