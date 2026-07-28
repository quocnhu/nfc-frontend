import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
  }

  const permRes = await fetch(`${BACKEND_URL}/dashboard/permissions`, {
    headers: { Cookie: `jwt=${accessToken}` },
  });

  const permData = await permRes.json();
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

  const redirectUrl = new URL("/profile", req.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("next-auth.session-token", nextAuthToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  response.cookies.set("jwt", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  if (refreshToken) {
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  return response;
}
