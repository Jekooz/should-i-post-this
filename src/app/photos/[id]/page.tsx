import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';

export const generateStaticParams = async () => {
  // This is a dynamic route, we cannot generate all params at build time.
  // Return an empty array to indicate that we will generate params on demand.
  return [];
};

export default async function PhotoPage({ params }: { params: { id: string } }) {
  const photoId = params.id;

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      captions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!photo) {
    notFound();
  }

  const latestAnalysis = photo.analyses[0];
  const latestCaption = photo.captions[0];

  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Photo Details</h1>
          <div className="flex space-x-3">
            <a href={`/edit/${photoId}`} className="button-link">
              Edit Photo
            </a>
          </div>
        </div>

        {/* Photo Preview */}
        <div className="space-y-6">
          <img
            src={photo.fileUrl}
            alt={`${photo.fileName} preview`}
            className="rounded-lg border w-full h-[400px] object-cover"
          />
        </div>

        {/* Photo Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Photo Info</h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium">File Name</p>
              <p className="text-muted-foreground">{photo.fileName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">File Size</p>
              <p className="text-muted-foreground">
                {(photo.fileSize ?? 0) / 1024 / 1024} MB
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">MIME Type</p>
              <p className="text-muted-foreground">{photo.mimeType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Date Taken</p>
              <p className="text-muted-foreground">
                {photo.dateTaken ? new Date(photo.dateTaken).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Camera Model</p>
              <p className="text-muted-foreground">
                {photo.cameraModel ?? 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-muted-foreground">
                {photo.location ?? 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        {latestAnalysis && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Latest Analysis</h2>
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Overall Score</p>
                  <p className="text-muted-foreground">
                    {photo.overallScore?.toFixed(1) ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Aesthetic</p>
                  <p className="text-muted-foreground">
                    {photo.aestheticScore?.toFixed(1) ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Emotion</p>
                  <p className="text-muted-foreground">
                    {photo.emotionScore?.toFixed(1) ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Social</p>
                  <p className="text-muted-foreground">
                    {photo.socialScore?.toFixed(1) ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Composition</p>
                  <p className="text-muted-foreground">
                    {photo.compositionScore?.toFixed(1) ?? 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Caption Section */}
        {latestCaption && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Latest Caption</h2>
            <div className="space-y-4">
              <p className="text-lg">{latestCaption.caption}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {latestCaption.hashtags
                  ? JSON.parse(latestCaption.hashtags).map((tag: string) => (
                      <span key={tag} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        #{tag}
                      </span>
                    ))
                  : []}
                {latestCaption.emojis
                  ? JSON.parse(latestCaption.emojis).map((emo: string) => (
                      <span key={emo} className="text-xl">
                        {emo}
                      </span>
                    ))
                  : []}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}