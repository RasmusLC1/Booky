import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import db from "@/db/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { productid } = await req.json();

    if (!productid) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productid } });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Include the user's orders in the query
    const user = await db.user.findUnique({
      where: { email: session.user.email || "" },
      include: { orders: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const priceInCents = product.priceInCents;

    const order = await db.order.create({
      data: {
        productid: product.id,
        priceInCents,
        userid: user.id,
      },
    });

    return NextResponse.json({ message: "Order added successfully!", order });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
