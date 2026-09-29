import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { calSans, geistMono, geistSans } from '@/lib/fonts';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'Calliva — Multilingual AI Receptionist',
    template: '%s · Calliva',
  },
  description:
    'Calliva answers customer calls in Hindi, English, Tamil, and Telugu — books appointments, captures hot leads, and sends instant WhatsApp confirmations.',
  applicationName: 'Calliva',
  keywords: [
    'Calliva',
    'AI receptionist',
    'voice agent',
    'multilingual',
    'lead capture',
    'Cal.com booking',
    'Next.js 15',
  ],
  openGraph: {
    title: 'Calliva — Multilingual AI Receptionist',
    description:
      'Never miss a customer call. Calliva answers in real-time voice, in your language.',
    siteName: 'Calliva',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calliva — Multilingual AI Receptionist',
    description:
      'Never miss a customer call. Calliva answers in real-time voice, in your language.',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${calSans.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
