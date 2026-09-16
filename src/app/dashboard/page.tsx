'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Activity {
  type: 'analysis' | 'caption';
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
  albumsCount: number;
  photosCount: number;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReSync = async () => {
    try {
      const response = await fetch('/api/immich?endpoint=sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Add any required params here if needed
      });

      if (!response.ok) {
        throw new Error('Failed to start re-sync');
      }

      toast.success('Re-sync started successfully');
      // We could refresh the dashboard data after a delay to show updated sync status
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start re-sync');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-foreground py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Overview of your Immich connection, photo analytics, and recent activity.</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/settings" passHref>
                <Button variant="outline" className="shadow-sm">
                  Settings
                </Button>
              </Link>
              <Link href="/" passHref>
                <Button className="shadow-sm">
                  Analyze New Photo
                </Button>
              </Link>
            </div>
          </div>

          <Alert variant="destructive">
            {error}
          </Alert>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Show zeros in case of error */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyzed Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Picks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your Immich connection, photo analytics, and recent activity.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/settings" passHref>
              <Button variant="outline" className="shadow-sm">
                Settings
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button className="shadow-sm">
                Analyze New Photo
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalPhotoCount.toLocaleString() ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.analyzedPhotoCount ? `${((data.analyzedPhotoCount / data.totalPhotoCount) * 100).toFixed(1)}% analyzed` : 'No photos yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analyzed Photos</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.analyzedPhotoCount.toLocaleString() ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.totalPhotoCount ? `${((data.analyzedPhotoCount / data.totalPhotoCount) * 100).toFixed(1)}% analyzed` : 'No photos yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.averageOverallScore.toFixed(1) ?? '0.0'}</div>
              <p className="text-xs text-muted-foreground">
                {data?.analyzedPhotoCount ? `Top ${((data.topPicksCount / data.analyzedPhotoCount) * 100).toFixed(0)}% of all photos` : 'No analyzed photos'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Picks</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.topPicksCount.toLocaleString() ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Score ≥ 9.0
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest analyzed photos and generated captions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        <img
                          src={activity.photo.fileUrl || '/placeholder-photo.jpg'}
                          alt="Photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{activity.photo.fileName || 'Unnamed photo'}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type === 'analysis'
                            ? `Score: ${activity.overallScore?.toFixed(1) ?? 'N/A'} • Analyzed`
                            : 'Generated caption'
                          } {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link href={`/photos/${activity.photo.id}`} passHref>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent activity yet. Analyze your first photo to see activity here!
                </div>
              )}
            </CardContent>
            {data?.recentActivity && data.recentActivity.length > 5 && (
              <CardFooter className="border-t pt-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing 5 of {data.recentActivity.length} activities
                </p>
                <Link href="/activity" passHref>
                  <Button variant="outline" size="sm">
                    View All Activity
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>

          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle>Immich Status</CardTitle>
              <CardDescription>
                Connection and sync status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.immichSync ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full animate-pulse ${
                      data.immichSync.status === 'connected' ? 'bg-green-500' :
                      data.immichSync.status === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {data.immichSync.status === 'connected' ? 'Connected to Immich' :
                       data.immichSync.status === 'syncing' ? 'Syncing with Immich...' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium text-foreground">Server:</span> {data.immichSync.serverUrl}</p>
                    <p><span className="font-medium text-foreground">Last Sync:</span> {data.immichSync.lastSyncedAt ? new Date(data.immichSync.lastSyncedAt).toLocaleString() : 'Never'}</p>
                    <p><span className="font-medium text-foreground">Albums Synced:</span> {data.immichSync.albumsCount}</p>
                    <p><span className="font-medium text-foreground">Photos Synced:</span> {data.immichSync.photosCount.toLocaleString()}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Not connected to Immich. Connect in settings to sync your photos.
                </div>
              )}

              <div className="space-y-2 pt-2">
                {data?.immichSync && (
                  <Button
                    variant="outline"
                    className="w-full shadow-sm"
                    onClick={handleReSync}
                    disabled={!data.immichSync || data.immichSync.status === 'syncing'}
                  >
                    {data.immichSync.status === 'syncing' ? 'Syncing...' : 'Re-sync Now'}
                  </Button>
                )}
                <Link href="/settings" passHref className="w-full">
                  <Button variant="outline" className="w-full shadow-sm">
                    Manage Connection
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}