import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  isStudioConfigured,
  verifySessionToken,
} from "@/lib/auth";

/**
 * Guards the private studio. Everything under /studio and /api/studio requires
 * a valid session, except the login page and the login endpoint itself.
 * When the studio isn't configured at all, the routes 404 as if absent.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/studio/login";
  const isLoginApi = pathname === "/api/studio/login";

  if (!isStudioConfigured()) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (isLoginPage || isLoginApi) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, message: "Not signed in." },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/studio/login", req.url);
  if (pathname !== "/studio") loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/studio/:path*", "/api/studio/:path*"],
};
