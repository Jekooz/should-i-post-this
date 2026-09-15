import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your API keys and Immich connection.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Provider Keys</CardTitle>
            <CardDescription>
              Your Anthropic and OpenAI keys are read from environment variables on the server. For local development, set them in .env.local.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Anthropic API Key</Label>
              <Input type="password" placeholder="sk-ant-..." disabled value="••••••••••••" />
            </div>
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <Input type="password" placeholder="sk-..." disabled value="••••••••••••" />
            </div>
            <Button variant="outline" size="sm">Manage in .env.local</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Immich Connection</CardTitle>
            <CardDescription>
              Connection is also sourced from IMMICH_URL / IMMICH_API_KEY. Use the sync route to update it at runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Server and key are stored securely server-side and never exposed to the client bundle.</p>
            <Button variant="outline" size="sm">Test Connection</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
