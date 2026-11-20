import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function GET(request: NextRequest) {
  const productid = request.nextUrl.pathname.split("/").pop();

  const session = await getServerSession();
  const email = session?.user?.email;

  if (!productid || !email) {
    return NextResponse.json(
      { error: "Product ID and User ID are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${process.env.API_URL}/api/reviews/${encodeURIComponent(productid)}/mine`,
      {
        headers: {
          "X-Internal-Key": process.env.INTERNAL_API_KEY!,
          "X-User-Email": email,
        },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({ error: "Unexpected response" }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}