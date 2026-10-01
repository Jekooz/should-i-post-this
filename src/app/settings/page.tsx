'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Copy, KeyRound, PlugZap, RefreshCw } from 'lucide-react';

interface SettingsData {
  hasHuggingFaceKey: boolean;
  immich: { hasUrl: boolean; hasApiKey: boolean; connected: boolean };
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok ? 'bg-success/15 text-success' : 'bg-amber-500/15 text-amber-600'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-success' : 'bg-amber-500'}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadSettings = () => {
    setLoading(true);
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
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
      loadSettings();
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
    <main className="min-h-[calc(100vh-3.5rem)] py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Server configuration is read from environment variables — values never reach the browser.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  AI Provider
                </CardTitle>
                {!loading && (
                  <StatusPill
                    ok={Boolean(settings?.hasHuggingFaceKey)}
                    label={settings?.hasHuggingFaceKey ? 'Configured' : 'Not configured'}
                  />
                )}
              </div>
              <CardDescription>
                Photo analysis runs on Hugging Face Inference Providers. Create a token at{' '}
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  huggingface.co/settings/tokens
                </a>{' '}
                with &quot;Make calls to Inference Providers&quot; permission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Checking configuration…</p>
              ) : settings?.hasHuggingFaceKey ? (
                <p className="text-sm text-muted-foreground">
                  Token is set in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code> and
                  stored server-side only.
                </p>
              ) : (
                <Alert
                  variant="warning"
                  title="No AI token configured"
                >
                  Set <code className="rounded bg-muted px-1 py-0.5 text-xs">HUGGINGFACE_API_KEY</code> in{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>, then restart the
                  server. Photo analysis will fail until then.
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={copyEnvHints}
                  className="inline-flex items-center gap-1 rounded underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" /> Copy env var template
                </button>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <PlugZap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Immich Connection
                </CardTitle>
                {!loading && (
                  <StatusPill
                    ok={Boolean(settings?.immich.connected)}
                    label={settings?.immich.connected ? 'Connected' : 'Not connected'}
                  />
                )}
              </div>
              <CardDescription>
                {settings?.immich.hasUrl
                  ? 'Immich URL is configured. Test the connection to verify your API key.'
                  : 'Set IMMICH_URL and IMMICH_API_KEY in .env.local, or connect from the home page.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Checking configuration…</p>
              ) : (
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                    <span className="text-muted-foreground">Server URL</span>
                    <StatusPill ok={Boolean(settings?.immich.hasUrl)} label={settings?.immich.hasUrl ? 'Set' : 'Missing'} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                    <span className="text-muted-foreground">API key</span>
                    <StatusPill ok={Boolean(settings?.immich.hasApiKey)} label={settings?.immich.hasApiKey ? 'Set' : 'Missing'} />
                  </div>
                </div>
              )}

              {testResult && (
                <Alert variant={testResult.ok ? 'success' : 'destructive'}>{testResult.msg}</Alert>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testing}>
                  {testing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <PlugZap className="h-4 w-4" aria-hidden="true" />
                  )}
                  {testing ? 'Testing…' : 'Test Connection'}
                </Button>
                <Button variant="ghost" size="sm" onClick={loadSettings} disabled={loading}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reload
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                If the test fails with &quot;Invalid API key&quot;, generate a fresh key in Immich under{' '}
                <span className="font-medium text-foreground">User Settings → API Keys</span> and update{' '}
                <code className="rounded bg-muted px-1 py-0.5">IMMICH_API_KEY</code>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
