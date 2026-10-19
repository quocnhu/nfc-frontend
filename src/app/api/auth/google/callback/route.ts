import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const SECURE_COOKIES = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
  }

  const permRes = await fetch(`${BACKEND_URL}/api/dashboard/permissions`, {
    headers: { Cookie: `jwt=${accessToken}` },
    cache: "no-store",
  });

  if (!permRes.ok) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
  }

  const permData = await permRes.json().catch(() => ({}));
  const data = permData?.data;

  if (!data?.user) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
  }

  const nextAuthToken = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    token: {
      sub: data.user.id,
      id: data.user.id,
      email: data.user.email,
      name: data.user.fullname,
      role: data.role,
      permissions: data.mergedPermissions || [],
      avatarUrl: data.user.avatarUrl || null,
      userType: data.user.userType || 'GOOGLE',
    },
    maxAge: SESSION_MAX_AGE,
  });

  // Tokens were consumed from the query string above; redirect to a clean path so
  // they are never echoed back in the browser URL/history.
  // Ideal fix (requires backend changes): have the backend issue a one-time code
  // instead of putting tokens in the URL, and exchange it here.
  const response = NextResponse.redirect(new URL("/dashboard", req.url));

  response.cookies.set("next-auth.session-token", nextAuthToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: SECURE_COOKIES,
  });

  response.cookies.set("jwt", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
    secure: SECURE_COOKIES,
  });

  if (refreshToken) {
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      secure: SECURE_COOKIES,
    });
  }

  return response;
}
