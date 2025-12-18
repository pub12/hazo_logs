import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'hazo_logs Test App',
  description: 'Test application for hazo_logs package',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
