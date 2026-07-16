import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SESSION_MAX_AGE = 15 * 60;

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

  const backendSetCookie = signinRes.headers.get("set-cookie");

  const permRes = await fetch(`${BACKEND_URL}/dashboard/permissions`, {
    headers: { Cookie: backendSetCookie?.split(";")[0] || "" },
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

  if (backendSetCookie) {
    const cookiePair = backendSetCookie.split(";")[0];
    const eqIndex = cookiePair.indexOf("=");
    const name = cookiePair.substring(0, eqIndex).trim();
    const value = cookiePair.substring(eqIndex + 1).trim();
    response.cookies.set(name, value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }

  return response;
}
