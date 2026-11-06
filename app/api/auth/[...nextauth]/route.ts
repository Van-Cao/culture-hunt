import { googleAuthConfigured, handlers } from "@/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (!googleAuthConfigured) {
    if (request.nextUrl.pathname.endsWith("/session"))
      return Response.json(null);
    if (request.nextUrl.pathname.endsWith("/providers"))
      return Response.json({});
    return Response.json(
      { error: "Google sign-in is not configured." },
      { status: 503 },
    );
  }
  return handlers.GET(request);
}
export async function POST(request: NextRequest) {
  if (!googleAuthConfigured)
    return Response.json(
      { error: "Google sign-in is not configured." },
      { status: 503 },
    );
  return handlers.POST(request);
}
