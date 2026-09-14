'use client';

import { useState } from 'react';
import { useImmich } from '@/hooks/use-immich';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';

export function ImmichConnect() {
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { connect, status, error } = useImmich();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect({ serverUrl, apiKey });
      toast.success('Connected to Immich server');
    } catch (err) {
      toast.error('Failed to connect to Immich server');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Immich Integration</h2>
      {status === 'connected' && (
        <Alert variant="success">
          Connected to Immich server
        </Alert>
      )}
      {status === 'error' && (
        <Alert variant="destructive">
          {error || 'Connection failed'}
        </Alert>
      )}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleConnect();
      }} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serverUrl">Immich Server URL</Label>
          <Input
            id="serverUrl"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://your-immich-server.com"
            disabled={isConnecting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key (optional)</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Immich API key"
            disabled={isConnecting}
          />
        </div>
        <Button
          type="submit"
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect to Immich'}
        </Button>
      </form>
    </div>
  );
}