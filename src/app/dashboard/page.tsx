import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <main className="space-y-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Immich connection and photo analytics will appear here.
        </p>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Immich Connection Status</CardTitle>
            <CardDescription>
              Check your Immich server connection and last sync time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Connected</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Last sync: Just now
            </div>
            <Button variant="outline" size="sm">
              Re-sync now
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              See your latest analyzed photos and generated captions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No recent activity yet. Start by uploading photos or connecting to Immich.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}