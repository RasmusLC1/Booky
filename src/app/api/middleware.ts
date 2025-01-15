import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@upstash/redis";

// Create a rate limiter using a sliding window algorithm
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "60 s"), // 15 requests per 60 seconds
});

// Middleware to handle rate limiting
export async function middleware(request: Request) {
  // Use `request.ip` for a more reliable IP address
  const ip = request.ip || request.headers.get("x-forwarded-for") || "127.0.0.1";

  // Check the rate limit for this IP
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    // Return a JSON response with a 429 status code
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
        },
      }
    );
  }

  // Proceed to the next middleware or route
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/api/:path*"], // Apply to sensitive routes
};
