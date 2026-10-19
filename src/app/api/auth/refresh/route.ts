import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SECURE_COOKIES = process.env.NODE_ENV === "production";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: `refresh_token=${refreshToken}`,
    },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    const response = NextResponse.json({ error: "Refresh failed" }, { status: 401 });

    // Clear all auth cookies to break the redirect loop
    response.cookies.set("next-auth.session-token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: SECURE_COOKIES,
    });
    response.cookies.set("jwt", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: SECURE_COOKIES,
    });
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: SECURE_COOKIES,
    });

    return response;
  }

  const rawCookies = backendRes.headers.getSetCookie();
  let accessToken = "";
  let refreshTokenNew = "";

  for (const cookie of rawCookies) {
    const pair = cookie.split(";")[0].trim();
    const eqIdx = pair.indexOf("=");
    const name = pair.substring(0, eqIdx).trim();
    const value = pair.substring(eqIdx + 1).trim();
    if (name === "jwt") accessToken = value;
    if (name === "refresh_token") refreshTokenNew = value;
  }

  const response = NextResponse.json({ success: true });

  if (accessToken) {
    response.cookies.set("jwt", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
      secure: SECURE_COOKIES,
    });
  }

  if (refreshTokenNew) {
    response.cookies.set("refresh_token", refreshTokenNew, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      secure: SECURE_COOKIES,
    });
  }

  return response;
}
