import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { GameError } from "./store";

export async function playerId() {
  const jar = await cookies();
  const existing = jar.get("culture-hunt-player")?.value;
  if (existing && /^[a-f0-9-]{36}$/.test(existing)) return existing;
  const id = randomUUID();
  jar.set("culture-hunt-player", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Next's internal Request URL can use localhost while the browser uses 127.0.0.1.
  // Compare against the actual incoming authority, preserving the same-origin check.
  let valid = true;
  if (origin) {
    try {
      const incoming = new URL(request.url);
      const source = new URL(origin);
      const host = request.headers.get("host") || incoming.host;
      const protocol =
        request.headers.get("x-forwarded-proto") ||
        incoming.protocol.replace(":", "");
      valid = source.host === host && source.protocol === `${protocol}:`;
    } catch {
      valid = false;
    }
  }
  if (!valid)
    throw new GameError("Nguồn yêu cầu không hợp lệ. / Invalid origin.", 403);
}
export function gameResponse(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function gameError(error: unknown) {
  if (error instanceof GameError)
    return gameResponse({ error: error.message }, error.status);
  if (error instanceof SyntaxError)
    return gameResponse(
      { error: "Dữ liệu không hợp lệ. / Invalid request." },
      400,
    );
  // Never return provider diagnostics or credentials to the browser.
  console.error(
    "Palace request failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return gameResponse(
    {
      error:
        "Chưa lưu được hành trình. Vui lòng thử lại. / Could not save your journey. Please retry.",
    },
    500,
  );
}
