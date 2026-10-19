import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/users", "/sharing-content", "/history", "/upload", "/folder", "/qr", "/avatar", "/nfc", "/profile", "/homepage", "/payments", "/renew", "/upgrade", "/subscriptions", "/plans", "/translation"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Backend file-proxy used by anonymous <img> tags — must never redirect to /login.
  if (pathname === "/upload/userdata/file") {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "next-auth.session-token",
  });

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
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
    "/upgrade/:path*",
    "/subscriptions/:path*",
    "/plans/:path*",
    "/translation/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
