import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

function withAdminHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function nextWithAdminPath(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-request-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return withAdminHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.has("better-auth.session_token") || request.cookies.has("__Secure-better-auth.session_token");
}

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isPublic || hasSessionCookie(request)) return nextWithAdminPath(request);

  const loginUrl = new URL("/admin/login", request.url);
  if (pathname.startsWith("/admin/") && pathname !== "/admin/login") {
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  }
  return withAdminHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: "/admin/:path*",
};
