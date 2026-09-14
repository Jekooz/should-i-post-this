import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';
import { handleAPIError, createSuccessResponse } from '@/lib/api-client';
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadsDir, uniqueFilename);

    // Convert file to buffer and write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Get default user
    const user = await getOrCreateDefaultUser();

    // Save photo record in database
    const photo = await prisma.photo.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: `/uploads/${uniqueFilename}`,
        source: 'manual',
      },
    });

    return createSuccessResponse(photo, 'Photo uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    return handleAPIError(error);
  }
}