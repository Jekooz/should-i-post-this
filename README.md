# Trip Photo Analyzer

A Next.js 14 + TypeScript application that helps you select the best photos from your trips and generate engaging captions for social media. The app integrates with [Immich](https://immich.app/) (self-hosted photo management) and uses AI vision models via [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) for photo analysis and caption generation.

## Features

- **Manual Upload**: Drag & drop or select photos from your device.
- **Immich Integration**: Connect to your self-hosted Immich server to browse albums and sync photos.
- **AI-Powered Analysis**: Analyze photos on composition, aesthetics, emotion, and social readiness using open vision models (Llama 4, Qwen-VL, and more).
- **Smart Caption Generation**: Generate engaging captions with hashtags and emojis tailored to each photo.
- **Photo Scoring & Ranking**: Get an overall score and breakdown to pick the best shots.
- **Dashboard & Activity**: See photo counts, average scores, recent activity, and Immich sync status.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (+ Immer)
- **AI Providers**: Hugging Face Inference Providers (OpenAI-compatible router, `openai` SDK)
- **Database**: Prisma ORM with SQLite (dev)
- **Photo Processing**: exifr (EXIF)
- **Toasts**: react-hot-toast
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js >= 18
- npm / yarn / pnpm
- An Immich server (optional, for Immich features)
- A Hugging Face token with Inference Providers permission (for AI features)

### Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables. Create `.env.local`:

   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # AI (required for analysis/captions)
   HUGGINGFACE_API_KEY=your_hf_token_here
   # HUGGINGFACE_MODEL=meta-llama/Llama-4-Scout-17B-16E-Instruct

   # Immich (optional)
   IMMICH_URL=http://your-immich-server:2283
   IMMICH_API_KEY=your_immich_api_key_here
   ```

3. Initialize the database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Manual Upload & Analyze

1. Drag & drop photos onto the upload zone (JPG, PNG, WebP supported; HEIC uploads stored but not AI-analyzable).
2. Click a photo in **Your Photos** to select it.
3. Click **Analyze with AI** in the sidebar to get scores and a caption.
4. Use the **AI Caption Generator** panel to create captions in casual, professional, witty, or poetic styles.

### Immich Integration

1. Enter your Immich server URL and API key in the **Immich Server** panel and click **Connect**.
2. Browse albums, then **Sync to Analysis** to import a album's photos into the app.
3. Synced photos behave like uploads: select and analyze them with AI.

### Dashboard

- Visit `/dashboard` for connection status, photo analytics, and recent activity.
- Visit `/activity` for the full activity log.

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── analyze/            # Photo analysis endpoint (upload or photoId)
│   │   ├── captions/           # Caption generation endpoint
│   │   ├── dashboard/          # Dashboard stats
│   │   ├── immich/             # Immich proxy endpoints (albums, photos, assets, sync)
│   │   ├── photos/             # List persisted photos
│   │   ├── settings/           # Config status (booleans only, never secrets)
│   │   ├── upload/             # File upload endpoint
│   │   └── uploads/[...slug]/  # Secure static file serving
│   ├── dashboard/              # Dashboard page
│   ├── photos/[id]/            # Photo detail page
│   ├── settings/               # Settings page
│   ├── activity/               # Activity log page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home (upload + gallery + analysis)
├── components/                 # Reusable UI components
│   ├── gallery/                # ImageUploader, PhotoCard, PhotoGrid
│   ├── immich/                 # ImmichConnect, AlbumBrowser
│   ├── caption/                # CaptionGenerator, CaptionPreview
│   ├── analysis/               # ScoreRing, ScoreBreakdown
│   ├── layout/                 # Navbar
│   └── ui/                     # Button, Card, Input, Label, Alert, Toast
├── hooks/                      # useUpload, useImmich
├── lib/                        # db, env, ai-huggingface, immich, scoring, api-client
├── store/                      # Zustand store (photo-store)
└── types/                      # TypeScript interfaces
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Upload a photo (multipart), stores file + DB row |
| POST | `/api/analyze` | Analyze photo — multipart `file` or JSON `{ photoId }` |
| POST | `/api/captions` | Generate caption for a photo (`{ photoId, style }`) |
| GET | `/api/captions?photoId=` | List captions for a photo |
| GET | `/api/photos` | List persisted photos |
| GET | `/api/immich/albums` | List Immich albums |
| GET | `/api/immich/photos?albumId=` | List assets in an album |
| GET | `/api/immich/assets/[id]` | Proxy Immich original asset |
| GET | `/api/immich/assets/[id]/thumbnail` | Proxy Immich preview thumbnail |
| POST | `/api/immich?endpoint=connect` | Test + save Immich connection |
| POST | `/api/immich?endpoint=sync` | Sync recent Immich assets into the DB |
| POST | `/api/immich/sync` | Sync a specific album (`{ albumId, assetIds }`) |
| GET/DELETE | `/api/immich?endpoint=status\|disconnect` | Connection status / disconnect |
| GET | `/api/dashboard` | Dashboard stats + recent activity |
| GET | `/api/settings` | Config status (booleans only) |
| GET | `/api/uploads/[...slug]` | Serve uploaded files (path-traversal protected) |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection string | `file:./dev.db` |
| `HUGGINGFACE_API_KEY` | Hugging Face token (Inference Providers permission) | `hf_...` |
| `HUGGINGFACE_MODEL` | Vision model for analysis/captions | `meta-llama/Llama-4-Scout-17B-16E-Instruct` |
| `IMMICH_URL` | Base URL of your Immich server (no trailing slash) | `http://192.168.1.100:2283` |
| `IMMICH_API_KEY` | API key for Immich (generate in Immich server settings) | `...` |

## Development

```bash
npm run lint        # Lint
npm run build       # Production build
npm run start       # Start production server
npm run db:push     # Push schema changes (dev)
npm run db:migrate  # Run migrations
npm run db:studio   # Open Prisma Studio
```

## Testing

Unit and integration tests are planned for future releases. Currently, manual testing is recommended.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component primitives
- [Immich](https://immich.app/) for the self-hosted photo solution
- [Hugging Face](https://huggingface.co/) for Inference Providers
- [Tailwind CSS](https://tailwindcss.com/) and [Zustand](https://zustand-demo.pmnd.rs/) for styling and state
