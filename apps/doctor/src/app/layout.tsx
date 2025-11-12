import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@ui/styles/globals.css";
import { TenantBootstrapper } from "../components/tenant-bootstrapper";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
      <body className={`${inter.variable} antialiased`}>
        <div className="min-h-screen bg-background text-foreground">
          <TenantBootstrapper />
          {children}
        </div>
      </body>
    </html>
  );
}

