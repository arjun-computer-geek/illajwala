"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  CalendarCheck,
  ShieldCheck,
  Menu,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@illajwala/ui";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Providers", href: "/providers", icon: Users2 },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
];

type AdminShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  userName?: string;
  onSignOut?: () => void;
};

export const AdminShell = ({
  children,
  title,
  description,
  actions,
  userName,
  onSignOut,
}: AdminShellProps) => {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          illajwala
        </div>
      </Link>
      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-4 pt-6">
        <Separator />
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {userName ?? "Admin"}
            </p>
            <p className="text-xs text-muted-foreground">Operations</p>
          </div>
          {onSignOut ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <Link
          href="mailto:support@illajwala.com"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LifeBuoy className="h-4 w-4" />
          Support
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r border-border/40 bg-background px-4 py-6 sm:block">
        {sidebar}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/40 bg-background px-4 py-3 shadow-sm sm:hidden">
          <Link href="/dashboard" className="font-semibold">
            Illajwala Admin
          </Link>
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 px-4 py-6">
              {sidebar}
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            {(title || description || actions) && (
              <div className="flex flex-col gap-4 border-b border-border/40 bg-background/60 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-lg sm:px-6">
                <div className="space-y-1">
                  {title ? (
                    <h1 className="text-2xl font-semibold text-foreground">
                      {title}
                    </h1>
                  ) : null}
                  {description ? (
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                {actions ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {actions}
                  </div>
                ) : null}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

