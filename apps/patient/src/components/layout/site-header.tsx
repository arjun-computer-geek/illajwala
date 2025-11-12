"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Container } from "./container";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const mainNavItems = [
  { href: "/search", label: "Find Doctors" },
  { href: "/account/appointments", label: "My Appointments" },
  { href: "/search?consultationMode=telehealth", label: "Video consults" },
];

export const SiteHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, role, clearAuth } = useAuth();

  const filteredNav = useMemo(() => {
    if (isAuthenticated) {
      return mainNavItems;
    }
    return mainNavItems.filter((item) => item.href !== "/account/appointments");
  }, [isAuthenticated]);

  const handleLogout = () => {
    clearAuth();
    toast.success("You have been signed out.");
    router.push("/");
  };

  const renderLinks = (onNavigate?: () => void) =>
    filteredNav.map((item) => {
      const isActive =
        item.href === "/account/appointments"
          ? pathname.startsWith(item.href)
          : pathname === item.href || pathname.startsWith(`${item.href}?`);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"
            }`}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-40 bg-white/85 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.65)] shadow-primary/10 backdrop-blur-xl supports-backdrop-filter:bg-white/75 dark:bg-background/90 dark:shadow-[0_22px_48px_-32px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_16px_36px_-20px_rgba(8,47,73,0.55)] transition-all group-hover:scale-[1.03] dark:bg-card dark:shadow-[0_18px_42px_-22px_rgba(10,20,35,0.75)] dark:ring-1 dark:ring-primary/25">
            <Image
              src="/logo.png"
              alt="illajwala logo"
              fill
              sizes="44px"
              className="object-contain p-2"
              priority
            />
          </span>

          <span className="text-xl font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            illajwala
          </span>


        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {renderLinks()}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-full px-4 py-2">
                  <UserRound className="h-4 w-4" />
                  {role === "doctor" ? "Doctor portal" : "My account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account/appointments">Appointments</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/search">Find a doctor</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" className="rounded-full px-5 py-2" asChild>
                <Link href="/auth/patient/login">Sign in</Link>
              </Button>
              <Button variant="brand" size="sm" className="rounded-full px-5 py-2" asChild>
                <Link href="/auth/patient/register">Create account</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6">
              <div className="mt-10 flex flex-col gap-4 text-lg font-medium">
                {renderLinks(() => setOpen(false))}
              </div>
              <div className="mt-auto flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link href="/account/appointments">My appointments</Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild onClick={() => setOpen(false)}>
                      <Link href="/auth/patient/login">Sign in</Link>
                    </Button>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link href="/auth/patient/register">Create account</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
};

