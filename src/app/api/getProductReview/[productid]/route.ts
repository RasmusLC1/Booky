import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const productid = request.nextUrl.pathname.split("/").pop();

  if (!productid) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${process.env.API_URL}/api/reviews/${encodeURIComponent(productid)}`, // Prevents weird IDs from changing URL
      {
        headers: { "X-Internal-Key": process.env.INTERNAL_API_KEY! },
        cache: "no-store", // Prevent stale reviews
      }
    );

    const data = await res.json().catch(() => ({ error: "Unexpected response" }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}