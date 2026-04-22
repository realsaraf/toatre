import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { PostHogProvider } from './posthog-provider';

export const metadata: Metadata = {
  title: 'Plotto — Your life, plotted out.',
  description:
    'A calm timeline that captures every date, reminder, and thing-to-remember.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
