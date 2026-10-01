'use client';

import { useState } from 'react';
import { useImmich } from '@/hooks/use-immich';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';
import { PlugZap, Loader2 } from 'lucide-react';

export function ImmichConnect({ onConnected }: { onConnected?: () => void }) {
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { connect, status, error } = useImmich();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect({ serverUrl, apiKey });
      toast.success('Connected to Immich server');
      onConnected?.();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message.includes('401')
          ? 'Immich rejected the API key. Generate a new one in Immich settings.'
          : 'Failed to connect to Immich server'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <PlugZap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Connect at Runtime</h3>
        <span className="text-xs text-muted-foreground">(overrides .env.local)</span>
      </div>

      {status === 'connected' && (
        <Alert variant="success" className="mb-4">
          Connected to Immich server
        </Alert>
      )}
      {status === 'error' && (
        <Alert variant="destructive" className="mb-4">
          {error || 'Connection failed'}
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConnect();
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="serverUrl">Server URL</Label>
            <Input
              id="serverUrl"
              name="serverUrl"
              type="url"
              autoComplete="off"
              spellCheck={false}
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://your-immich-server:2283"
              disabled={isConnecting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste key from Immich settings"
              disabled={isConnecting}
            />
          </div>
        </div>
        <Button type="submit" disabled={isConnecting} size="sm">
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Connecting…
            </>
          ) : (
            <>
              <PlugZap className="h-4 w-4" aria-hidden="true" /> Connect
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
