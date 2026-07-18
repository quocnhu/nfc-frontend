import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/users", "/sharing-content", "/history", "/upload", "/folder", "/qr", "/avatar", "/nfc", "/profile", "/homepage", "/payments", "/renew"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("next-auth.session-token");

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    const profileUrl = new URL("/profile", request.url);
    return NextResponse.redirect(profileUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/sharing-content/:path*",
    "/history/:path*",
    "/upload/:path*",
    "/folder/:path*",
    "/qr/:path*",
    "/avatar/:path*",
    "/nfc/:path*",
    "/profile/:path*",
    "/homepage/:path*",
    "/payments/:path*",
    "/renew/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
