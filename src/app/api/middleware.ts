import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@upstash/redis";

// Create a new rate limiter, limiting each IP to X requests per timeframe
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, "60 s"), // 10 requests per 60s
});

export async function middleware(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
    matcher: ["/login", "/signup"],
  };