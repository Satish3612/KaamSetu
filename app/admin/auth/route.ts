import { NextResponse } from "next/server";
import { createAdminSessionToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") || "");
  const password = String(form.get("password") || "");
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  const environmentReady = Boolean(
    expectedUsername && expectedPassword && secret
  );
  const credentialsMatch = Boolean(
    environmentReady &&
      username === expectedUsername &&
      password === expectedPassword
  );

  console.info("Admin login attempt", {
    environmentReady,
    usernameConfigured: Boolean(expectedUsername),
    passwordConfigured: Boolean(expectedPassword),
    sessionSecretConfigured: Boolean(secret),
    credentialsMatch,
  });

  if (!credentialsMatch || !secret) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/dashboard", request.url), 303);
  response.cookies.set("kaamsetu_admin_session", await createAdminSessionToken(secret), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 60 * 60 * 24,
  });
  return response;
}
