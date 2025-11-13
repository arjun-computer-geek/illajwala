import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Poppins, IBM_Plex_Sans } from "next/font/google";
import "@ui/styles/globals.css";
import { TenantBootstrapper } from "../components/tenant-bootstrapper";

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
    default: "Illajwala Doctor Hub",
    template: "%s | Illajwala Doctor",
  },
  description:
    "Manage clinic schedules, appointments, and staff from the Illajwala Doctor Hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} ${plexSans.variable} antialiased`}>
        <div className="min-h-screen bg-background text-foreground">
          <Suspense fallback={null}>
            <TenantBootstrapper />
          </Suspense>
          {children}
        </div>
      </body>
    </html>
  );
}

