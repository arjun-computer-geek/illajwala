"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RESERVED_SUBDOMAINS = new Set(["admin", "illajwala", "api", "www"]);

export default function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const [subdomain] = host.split(".");

  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
    request.nextUrl.searchParams.set("clinic", subdomain);
    return NextResponse.rewrite(request.nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


