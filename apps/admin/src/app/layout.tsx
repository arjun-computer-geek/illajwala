import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Illajwala Admin Console',
    template: '%s | Illajwala Admin',
  },
  description:
    'Verify providers, manage clinics, and monitor platform health from the Illajwala Admin Console.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="min-h-screen bg-background text-foreground">{children}</div>
      </body>
    </html>
  );
}

