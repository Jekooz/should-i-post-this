import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/db';

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

    // Recent activity: combine recent analyses and captions, limit to 10 total
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

    // Combine and sort by date
    // Add a 'type' property to each item before combining to distinguish them later
    const recentActivity = [
      ...recentAnalyses.map((a) => ({ ...a, type: 'analysis' as const })),
      ...recentCaptions.map((c) => ({ ...c, type: 'caption' as const })),
    ]
      .map((item) => ({
        type: item.type,
        id: item.id,
        timestamp: item.createdAt,
        photo: {
          id: item.photo.id,
          fileName: item.photo.fileName,
          fileUrl: item.photo.fileUrl,
        },
        // For analysis, we can show the overall score if available
        ...(item.type === 'analysis' && {
          overallScore: item.photo.overallScore,
        }),
        // For caption, we can show the caption text
        ...(item.type === 'caption' && {
          caption: item.caption,
        }),
      }))
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