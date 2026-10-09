import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

function withAdminHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.has("better-auth.session_token") || request.cookies.has("__Secure-better-auth.session_token");
}

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isPublic || hasSessionCookie(request)) return withAdminHeaders(NextResponse.next());

  const loginUrl = new URL("/admin/login", request.url);
  return withAdminHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: "/admin/:path*",
};
