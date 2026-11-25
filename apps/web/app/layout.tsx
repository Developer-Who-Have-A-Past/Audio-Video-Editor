import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Video & Audio Editor',
  description: 'Edit video and audio on your device. Nothing is uploaded.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
