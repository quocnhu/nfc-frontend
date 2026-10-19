import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SECURE_COOKIES = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie");

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: "no-store",
    });
    if (!backendRes.ok) {
      console.error(`Backend logout failed with status ${backendRes.status}`);
    }
  } catch (error) {
    console.error("Backend logout request failed:", error);
  }

  const response = NextResponse.json({ success: true });
  const clearOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    secure: SECURE_COOKIES,
  };

  response.cookies.set("next-auth.session-token", "", clearOptions);
  response.cookies.set("jwt", "", clearOptions);
  response.cookies.set("refresh_token", "", clearOptions);

  return response;
}
