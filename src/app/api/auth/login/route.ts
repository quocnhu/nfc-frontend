import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const signinRes = await fetch(`${BACKEND_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!signinRes.ok) {
    const err = await signinRes.json().catch(() => ({ message: "Login failed" }));
    return NextResponse.json({ error: err.message || "Login failed" }, { status: signinRes.status });
  }

  const rawCookies = signinRes.headers.getSetCookie();

  let jwtValue = "";
  let refreshTokenValue = "";

  for (const cookie of rawCookies) {
    const pair = cookie.split(";")[0].trim();
    const eqIdx = pair.indexOf("=") ;
    const name = pair.substring(0, eqIdx).trim();
    const value = pair.substring(eqIdx + 1).trim();
    if (name === "jwt") jwtValue = value;
    if (name === "refresh_token") refreshTokenValue = value;
  }

  const permRes = await fetch(`${BACKEND_URL}/dashboard/permissions`, {
    headers: { Cookie: `jwt=${jwtValue}` },
  });

  const permData = await permRes.json();
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
    },
    maxAge: SESSION_MAX_AGE,
  });

  const response = NextResponse.json({ success: true });

  response.cookies.set("next-auth.session-token", nextAuthToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  if (jwtValue) {
    response.cookies.set("jwt", jwtValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
  }

  if (refreshTokenValue) {
    response.cookies.set("refresh_token", refreshTokenValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });
  }

  return response;
}
