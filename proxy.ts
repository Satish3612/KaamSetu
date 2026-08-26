import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionToken } from "./lib/admin-auth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || path.startsWith("/admin/auth")) return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = request.cookies.get("kaamsetu_admin_session")?.value;
  if (secret && token && (await verifyAdminSessionToken(token, secret))) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: "/admin/:path*" };
