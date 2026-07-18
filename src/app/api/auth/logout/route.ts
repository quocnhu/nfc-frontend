import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function POST() {
  fetch(`${BACKEND_URL}/auth/logout`, { method: "POST" }).catch(() => {});

  const response = NextResponse.json({ success: true });

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
