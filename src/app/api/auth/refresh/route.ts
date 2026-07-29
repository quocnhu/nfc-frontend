import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST(req: Request) {
  const refreshToken = req.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("refresh_token="))
    ?.split("=")[1];

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: `refresh_token=${refreshToken}`,
    },
  });

  if (!backendRes.ok) {
    const response = NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    
    // Clear all auth cookies to break the redirect loop
    response.cookies.set("next-auth.session-token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("jwt", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
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

  // Fallback to response body if cookies not found
  if (!accessToken || !refreshTokenNew) {
    const body = await backendRes.json().catch(() => ({}));
    if (body?.data?.access_token) accessToken = body.data.access_token;
    if (body?.data?.refresh_token) refreshTokenNew = body.data.refresh_token;
  }

  const response = NextResponse.json({ success: true });

  if (accessToken) {
    response.cookies.set("jwt", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
  }

  if (refreshTokenNew) {
    response.cookies.set("refresh_token", refreshTokenNew, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  return response;
}
