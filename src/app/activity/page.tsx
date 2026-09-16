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

interface ActivityData {
  recentActivity: Activity[];
}

export default function ActivityPage() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch activity data');
        }
        const result = await response.json();
        setData({ recentActivity: result.recentActivity });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
              <p className="text-muted-foreground">Your analyzed photos and generated captions.</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/" passHref>
                <Button variant="outline" className="shadow-sm">
                  Home
                </Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button className="shadow-sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
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
              <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
              <p className="text-muted-foreground">Overview of your analyzed photos and generated captions.</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/" passHref>
                <Button variant="outline" className="shadow-sm">
                  Home
                </Button>
              </Link>
              <Link href="/dashboard" passHref>
                <Button className="shadow-sm">
                  Dashboard
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
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
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
            <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
            <p className="text-muted-foreground">
              Your analyzed photos and generated captions, sorted by date.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/" passHref>
              <Button variant="outline" className="shadow-sm">
                Home
              </Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button className="shadow-sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
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
                  No activity yet. Analyze your first photo to see activity here!
                </div>
              )}
            </CardContent>
            {data?.recentActivity && data.recentActivity.length > 0 && (
              <CardFooter className="border-t pt-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {data.recentActivity.length} activities
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}