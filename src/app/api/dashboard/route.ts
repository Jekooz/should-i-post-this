import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';

// Stats must be computed per-request, never frozen at build time.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateDefaultUser();

    // Total photos for this user
    const totalPhotoCount = await prisma.photo.count({
      where: { userId: user.id },
    });

    // Analyzed photos (where analyzed is true)
    const analyzedPhotoCount = await prisma.photo.count({
      where: { userId: user.id, analyzed: true },
    });

    // Average overallScore (only for analyzed photos)
    const avgResult = await prisma.photo.aggregate({
      where: { userId: user.id, analyzed: true, overallScore: { not: null } },
      _avg: { overallScore: true },
    });
    const averageOverallScore = avgResult._avg.overallScore ?? 0;

    // Top picks: overallScore >= 9.0
    const topPicksCount = await prisma.photo.count({
      where: { userId: user.id, overallScore: { gte: 9.0 } },
    });

    // Recent activity: uploads + analyses + captions, limit to 10 total
    const recentAnalyses = await prisma.analysis.findMany({
      where: { photo: { userId: user.id } },
      include: { photo: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentCaptions = await prisma.caption.findMany({
      where: { photo: { userId: user.id } },
      include: { photo: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentUploads = await prisma.photo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity = [
      ...recentUploads.map((p) => ({
        type: 'upload' as const,
        id: `upload-${p.id}`,
        timestamp: p.createdAt,
        photo: { id: p.id, fileName: p.fileName, fileUrl: p.fileUrl },
      })),
      ...recentAnalyses.map((a) => ({
        type: 'analysis' as const,
        id: a.id,
        timestamp: a.createdAt,
        photo: { id: a.photo.id, fileName: a.photo.fileName, fileUrl: a.photo.fileUrl },
        ...(a.photo.overallScore != null && { overallScore: a.photo.overallScore }),
      })),
      ...recentCaptions.map((c) => ({
        type: 'caption' as const,
        id: c.id,
        timestamp: c.createdAt,
        photo: { id: c.photo.id, fileName: c.photo.fileName, fileUrl: c.photo.fileUrl },
        caption: c.caption,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    // Immich sync status: get the most recent ImmichSync record for the user
    const immichSync = await prisma.immichSync.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      totalPhotoCount,
      analyzedPhotoCount,
      averageOverallScore: Number(averageOverallScore.toFixed(1)),
      topPicksCount,
      recentActivity,
      immichSync: immichSync
        ? {
            serverUrl: immichSync.serverUrl,
            lastSyncedAt: immichSync.lastSyncedAt,
            albumsCount: immichSync.albumsCount,
            photosCount: immichSync.photosCount,
            status: immichSync.status,
          }
        : null,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}