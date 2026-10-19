import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;
const SECURE_COOKIES = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length === 0 ||
    password.length === 0 ||
    email.length > 320 ||
    password.length > 128
  ) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const signinRes = await fetch(`${BACKEND_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!signinRes.ok) {
    const err = await signinRes.json().catch(() => ({}));
    const message = typeof err?.message === "string" && err.message ? err.message : "Login failed";
    const retryAfter = err?.retryAfter;
    return NextResponse.json(
      { error: message, ...(retryAfter !== undefined ? { retryAfter } : {}) },
      { status: signinRes.status },
    );
  }

  const rawCookies = signinRes.headers.getSetCookie();

  let jwtValue = "";
  let refreshTokenValue = "";

  for (const cookie of rawCookies) {
    const pair = cookie.split(";")[0].trim();
    const eqIdx = pair.indexOf("=");
    const name = pair.substring(0, eqIdx).trim();
    const value = pair.substring(eqIdx + 1).trim();
    if (name === "jwt") jwtValue = value;
    if (name === "refresh_token") refreshTokenValue = value;
  }

  const permRes = await fetch(`${BACKEND_URL}/api/dashboard/permissions`, {
    headers: { Cookie: `jwt=${jwtValue}` },
    cache: "no-store",
  });

  if (!permRes.ok) {
    return NextResponse.json({ error: "Failed to load user data" }, { status: permRes.status });
  }

  const permData = await permRes.json().catch(() => ({}));
  const data = permData?.data;

  if (!data?.user) {
    return NextResponse.json({ error: "Failed to load user data" }, { status: 500 });
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
      userType: data.user.userType || 'LOCAL',
      avatarUrl: data.user.avatarUrl || null,
    },
    maxAge: SESSION_MAX_AGE,
  });

  const response = NextResponse.json({ success: true });

  response.cookies.set("next-auth.session-token", nextAuthToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: SECURE_COOKIES,
  });

  if (jwtValue) {
    response.cookies.set("jwt", jwtValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
      secure: SECURE_COOKIES,
    });
  }

  if (refreshTokenValue) {
    response.cookies.set("refresh_token", refreshTokenValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
      secure: SECURE_COOKIES,
    });
  }

  return response;
}
