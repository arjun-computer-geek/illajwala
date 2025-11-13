import type { Metadata } from "next";
import { Inter, Poppins, IBM_Plex_Sans } from "next/font/google";
import "@ui/styles/globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

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
    default: "illajwala | Find and book doctors nearby",
    template: "%s | illajwala",
  },
  description:
    "illajwala helps patients discover trusted specialists, compare availability, and book online or in-clinic appointments in minutes.",
  metadataBase: new URL("https://illajwala.com/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} ${plexSans.variable} antialiased`}>
        <AppProviders>
          <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
