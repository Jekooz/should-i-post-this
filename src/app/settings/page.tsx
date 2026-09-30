'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<{
    hasHuggingFaceKey: boolean;
    immich: { hasUrl: boolean; hasApiKey: boolean; connected: boolean };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/immich?endpoint=connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Test failed');
      setTestResult({ ok: true, msg: data.message || 'Successfully connected to Immich' });
      toast.success('Immich connection successful');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTestResult({ ok: false, msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const copyEnvHints = async () => {
    try {
      await navigator.clipboard.writeText(
        'HUGGINGFACE_API_KEY=\nHUGGINGFACE_MODEL=\nIMMICH_URL=\nIMMICH_API_KEY='
      );
      toast.success('Copied env var names to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your API keys and Immich connection.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Provider Keys</CardTitle>
            <CardDescription>
              Your Hugging Face token is read from environment variables on the server. For local development, set it in .env.local. Create one at huggingface.co/settings/tokens with &quot;Make calls to Inference Providers&quot; permission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hugging Face Token</Label>
                <span className={`text-xs px-2 py-0.5 rounded-full ${loading ? 'bg-muted text-muted-foreground' : settings?.hasHuggingFaceKey ? 'bg-green-500/15 text-green-600' : 'bg-amber-500/15 text-amber-600'}`}>
                  {loading ? 'checking…' : settings?.hasHuggingFaceKey ? 'configured' : 'not configured'}
                </span>
              </div>
              <Input type="password" placeholder={settings?.hasHuggingFaceKey ? 'Configured (stored server-side)' : 'hf_...'} disabled value="" />
            </div>
            {!loading && !settings?.hasHuggingFaceKey && (
              <Alert variant="destructive">
                No AI provider token is configured. Photo analysis will fail — set HUGGINGFACE_API_KEY in .env.local and restart the server.
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              Set keys in <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> and restart the dev server. Values are never sent to the browser.{' '}
              <button onClick={copyEnvHints} className="underline underline-offset-4 hover:text-foreground">Copy env var template</button>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Immich Connection</CardTitle>
            <CardDescription>
              {settings?.immich.hasUrl ? 'Immich URL configured' : 'Set IMMICH_URL / IMMICH_API_KEY in .env.local or connect at runtime.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${settings?.immich.connected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span className="text-muted-foreground">
                {loading ? 'Checking…' : settings?.immich.connected ? 'Connected' : 'Not connected'}
              </span>
              {settings?.immich.hasApiKey && !loading && <span className="text-xs bg-muted px-2 py-0.5 rounded">API key set</span>}
              {!settings?.immich.hasApiKey && !loading && <span className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded">No API key</span>}
            </div>
            <p className="text-sm text-muted-foreground">Server and key are stored securely server-side and never exposed to the client bundle.</p>
            {testResult && (
              <Alert variant={testResult.ok ? 'success' : 'destructive'}>
                {testResult.msg}
              </Alert>
            )}
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testing}>
              {testing ? 'Testing…' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}