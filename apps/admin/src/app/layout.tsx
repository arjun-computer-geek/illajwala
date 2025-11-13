import type { Metadata } from "next";
import { Inter, Poppins, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "@ui/styles/globals.css";

const inter = Inter({
  variable: "--font-illajwala-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-illajwala-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-illajwala-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Illajwala Admin Console",
    template: "%s | Illajwala Admin",
  },
  description:
    "Verify providers, manage clinics, and monitor platform health from the Illajwala Admin Console.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} ${plexSans.variable} bg-background text-foreground antialiased`}>
        <div className="min-h-screen">{children}</div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

