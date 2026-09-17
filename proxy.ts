import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === "/admin/login";
  const hasAdminSession = request.cookies.get("nexobd-admin-session")?.value === "active";
  if (isAdminRoute && !isLoginRoute && !hasAdminSession) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };