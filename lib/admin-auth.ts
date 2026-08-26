const encoder = new TextEncoder();

export async function createAdminSessionToken(secret: string) {
  const payload = `kaamsetu-admin:${Math.floor(Date.now() / 86_400_000)}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifyAdminSessionToken(token: string, secret: string) {
  const expectedToday = await createAdminSessionToken(secret);
  if (token === expectedToday) return true;
  const yesterday = new Date(Date.now() - 86_400_000);
  const payload = `kaamsetu-admin:${Math.floor(yesterday.getTime() / 86_400_000)}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return token === `${payload}.${Buffer.from(signature).toString("base64url")}`;
}
