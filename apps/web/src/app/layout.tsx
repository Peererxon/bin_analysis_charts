import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/sidebar';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BIN Analysis Charts — USDT/VES P2P Market',
  description:
    'Premium financial analytics dashboard for Binance P2P USDT/VES market analysis with real-time charts, comparisons, and alerts.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen">
        <Providers>
          <Sidebar />
          <main
            className="flex-1 lg:ml-64"
            role="main"
            id="main-content"
          >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
