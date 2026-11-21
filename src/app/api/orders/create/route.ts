import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function POST(req: NextRequest) {
  const session = await getServerSession(); // pass your authOptions here if you have them
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${process.env.API_URL}/api/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
        "X-User-Email": session.user.email,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: "Unexpected response" }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}