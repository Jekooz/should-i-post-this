import type { User } from '@prisma/client';

/**
 * Shared Immich server configuration + API helpers.
 * Used by every /api/immich route so behavior stays consistent.
 */

export interface ImmichConfig {
  url: string;
  key: string;
}

/** Resolve Immich credentials from the user record, falling back to env vars. */
export function getImmichConfig(
  user?: Pick<User, 'immichUrl' | 'immichApiKey'> | null
): ImmichConfig | null {
  const url = user?.immichUrl || process.env.IMMICH_URL || process.env.IMMICH_BASE_URL || '';
  const key = user?.immichApiKey || process.env.IMMICH_API_KEY || '';
  const cleanUrl = url.replace(/\/+$/, '');
  if (!cleanUrl) return null;
  return { url: cleanUrl, key };
}

export class ImmichError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ImmichError';
  }
}

async function immichFetch(
  config: ImmichConfig,
  path: string,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const res = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      'x-api-key': config.key,
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res;
}

/** GET JSON from Immich, throwing ImmichError on failure. */
export async function immichGetJSON<T = unknown>(
  config: ImmichConfig,
  path: string,
  timeoutMs = 15000
): Promise<T> {
  const res = await immichFetch(config, path);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ImmichError(res.status, `Immich error ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** Get an array from Immich payloads that are either arrays or { items } wrappers. */
export function asArray<T>(payload: T[] | { assets?: T[] } | { albums?: T[] } | null | undefined): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as { assets?: T[] }).assets)) return (payload as { assets: T[] }).assets!;
  if (payload && Array.isArray((payload as { albums?: T[] }).albums)) return (payload as { albums: T[] }).albums!;
  return [];
}

/** Fetch raw binary (thumbnails / originals) from Immich. */
export async function immichGetBinary(
  config: ImmichConfig,
  path: string,
  timeoutMs = 20000
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await immichFetch(
    config,
    path,
    { headers: { Accept: 'application/octet-stream' } },
    timeoutMs
  );
  if (!res.ok) {
    throw new ImmichError(res.status, `Immich error ${res.status}`);
  }
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') || 'application/octet-stream',
  };
}

/** Test connectivity — uses the modern /api/server/about endpoint with fallback. */
export async function testImmichConnection(config: ImmichConfig): Promise<boolean> {
  for (const path of ['/api/server/about', '/api/server-info', '/api/albums?limit=1']) {
    try {
      const res = await immichFetch(config, path, {}, 8000);
      if (res.ok) return true;
      // 401/403 means the server is reachable but the key is bad — still "reachable",
      // but treat as failure since operations would fail.
      if (res.status === 401 || res.status === 403) return false;
    } catch {
      // try next path
    }
  }
  return false;
}

// ─── Typed shapes for the Immich REST API responses we consume ───

export interface ImmichAlbumDTO {
  id: string;
  albumName: string;
  assetCount?: number;
  assets?: { id: string }[];
  createdAt?: string;
}

export interface ImmichAssetDTO {
  id: string;
  originalFileName?: string;
  type?: string;
  exifInfo?: {
    dateTimeOriginal?: string;
    city?: string;
    country?: string;
    model?: string;
  };
  fileCreatedAt?: string;
  localDateTime?: string;
  fileModifiedAt?: string;
}

export function mapAlbum(a: ImmichAlbumDTO) {
  return {
    id: a.id,
    name: a.albumName,
    photoCount: a.assetCount ?? a.assets?.length ?? 0,
    createdAt: a.createdAt,
  };
}

export function mapAsset(a: ImmichAssetDTO) {
  return {
    id: a.id,
    fileName: a.originalFileName || a.id,
    // Proxy URLs so the browser never needs the Immich URL or API key.
    thumbnailUrl: `/api/immich/assets/${a.id}/thumbnail`,
    fileUrl: `/api/immich/assets/${a.id}/original`,
    type: a.type,
    createdAt: a.localDateTime || a.fileCreatedAt || a.fileModifiedAt,
  };
}

/** Normalize a photo row (from any source) into the API's Photo shape. */
export function normalizePhoto(p: {
  id: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileSize: number;
  mimeType: string;
  overallScore?: number | null;
  category?: string | null;
  source?: string;
  analyzed?: boolean;
  createdAt?: Date;
}) {
  return {
    id: p.id,
    fileName: p.fileName,
    fileUrl: p.fileUrl,
    thumbnailUrl: p.thumbnailUrl ?? undefined,
    fileSize: p.fileSize,
    mimeType: p.mimeType,
    overallScore: p.overallScore ?? undefined,
    category: p.category ?? undefined,
    source: (p.source as 'manual' | 'immich') || 'manual',
    analyzed: p.analyzed ?? false,
    createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
  };
}
