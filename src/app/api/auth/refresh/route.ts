import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function POST(req: Request) {
  const refreshToken = req.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("refresh_token="))
    ?.split("=")[1];

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
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

  const setCookie = backendRes.headers.get("set-cookie") || "";
  const accessToken = setCookie.split(";")[0]?.split("=")[1] || "";
  const refreshTokenNew =
    setCookie
      .split(",")
      .map((c) => c.split(";")[0]?.trim())
      .find((c) => c.startsWith("refresh_token="))
      ?.split("=")[1] || "";

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
