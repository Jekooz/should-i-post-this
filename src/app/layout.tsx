import type { Metadata } from 'next';
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
  title: 'Trip Photo Analyzer | AI-Powered Photo Selection & Captions',
  description:
    'Upload your trip photos and let AI analyze them to find the best ones to post with engaging captions. Works with manual uploads and Immich integration.',
  keywords: ['photo analyzer', 'AI captions', 'Instagram captions', 'photo selection', 'Immich'],
  authors: [{ name: 'Trip Photo Analyzer' }],
  openGraph: {
    title: 'Trip Photo Analyzer',
    description: 'AI-powered photo analysis and caption generation',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <Navbar />
          {children}
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}