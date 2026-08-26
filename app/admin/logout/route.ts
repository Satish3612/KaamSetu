import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set("kaamsetu_admin_session", "", { httpOnly: true, path: "/admin", maxAge: 0 });
  return response;
}
