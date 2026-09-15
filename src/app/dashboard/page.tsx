import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
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
            <Button variant="outline" className="shadow-sm">
              Settings
            </Button>
            <Button className="shadow-sm">
              Analyze New Photo
            </Button>
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
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +18% from last month
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
              <div className="text-2xl font-bold">842</div>
              <p className="text-xs text-muted-foreground">
                +5% since last sync
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
              <div className="text-2xl font-bold">8.4</div>
              <p className="text-xs text-muted-foreground">
                Top 20% of all photos
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
              <div className="text-2xl font-bold">56</div>
              <p className="text-xs text-muted-foreground">
                9.0+ score
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
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    <img src="https://via.placeholder.com/100" alt="Photo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium">Summer Trip - Beach Sunset</p>
                    <p className="text-sm text-muted-foreground">Score: 9.2 • Analyzed 2 hours ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    <img src="https://via.placeholder.com/100" alt="Photo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium">Mountain Hike - Peak View</p>
                    <p className="text-sm text-muted-foreground">Score: 8.8 • Analyzed 5 hours ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    <img src="https://via.placeholder.com/100" alt="Photo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium">City Exploration - Night Lights</p>
                    <p className="text-sm text-muted-foreground">Score: 8.5 • Generated caption</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Showing 3 of 12 activities</p>
              <Button variant="outline" size="sm">View All Activity</Button>
            </CardFooter>
          </Card>

          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle>Immich Status</CardTitle>
              <CardDescription>
                Connection and sync status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connected to Immich</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Server:</span> http://192.168.31.35:2283</p>
                <p><span className="font-medium text-foreground">Last Sync:</span> Just now</p>
                <p><span className="font-medium text-foreground">Albums Synced:</span> 8</p>
                <p><span className="font-medium text-foreground">Photos Synced:</span> 1,234</p>
              </div>
              <div className="space-y-2 pt-2">
                <Button variant="outline" className="w-full shadow-sm">
                  Re-sync Now
                </Button>
                <Button variant="outline" className="w-full shadow-sm">
                  Manage Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}