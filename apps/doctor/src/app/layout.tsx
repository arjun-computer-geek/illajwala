import type { Metadata } from "next";
import "./globals.css";
import { TenantBootstrapper } from "../components/tenant-bootstrapper";

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
      <body>
        <div className="min-h-screen bg-background text-foreground">
          <TenantBootstrapper />
          {children}
        </div>
      </body>
    </html>
  );
}

