import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a Redis instance using environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create a rate limiter using a sliding window algorithm
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "60 s"), // 15 requests per 60 seconds
});

// Middleware to handle rate limiting
export async function middleware(request: Request) {
  // Extract the IP address from the `x-forwarded-for` header
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

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

// Apply this middleware to specific routes
export const config = {
  matcher: ["/login", "/signup", "/api/:path*"], // Apply to sensitive routes
};
