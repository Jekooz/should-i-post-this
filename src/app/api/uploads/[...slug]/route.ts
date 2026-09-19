import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { stat } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const slug = params.slug;
    if (!slug || slug.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Reconstruct the relative path from the slug
    const relativePath = slug.join('/');
    // Only allow files under the uploads directory
    if (!relativePath.startsWith('uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    // Prevent path traversal
    if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    const filePath = join(process.cwd(), relativePath);

    // Check if file exists and is a regular file
    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        return NextResponse.json(
          { success: false, error: 'Not found' },
          { status: 404 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    // Determine content type based on extension
    const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      txt: 'text/plain',
      json: 'application/json',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Read and return the file
    const buffer = await require('fs/promises').readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        // Cache for 1 day for uploads (they are immutable)
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}