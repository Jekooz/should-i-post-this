import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import ToastContainer from '@/components/ui/toast-container';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Should I Post This? | AI Photo Selection & Captions',
  description:
    'Upload your trip photos and let AI analyze them to find the best ones to post with engaging captions. Works with manual uploads and Immich integration.',
  keywords: ['photo analyzer', 'AI captions', 'Instagram captions', 'photo selection', 'Immich'],
  authors: [{ name: 'Should I Post This?' }],
  openGraph: {
    title: 'Should I Post This?',
    description: 'AI-powered photo analysis and caption generation',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <div id="main-content">{children}</div>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
