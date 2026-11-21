import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import PurchaseReceiptEmail from "@/email/PurchaseReceipt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

interface FulfillOrderResponse {
  orderId: string;
  createdAt: string;
  priceInCents: number;
  productId: string;
  productName: string;
  productImagePath: string | null;
  productDescription: string | null;
  downloadVerificationId: string;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    const productId = charge.metadata?.productid;
    const email = charge.billing_details?.email;
    const priceInCents = charge.amount;

    if (!productId || !email) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const apiRes = await fetch(`${process.env.API_URL}/api/orders/fulfill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
        "X-User-Email": normalizedEmail,
      },
      body: JSON.stringify({
        productId,
        email: normalizedEmail,
        priceInCents,
      }),
      cache: "no-store",
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => null);
      return NextResponse.json(
        { message: errBody?.message ?? "Failed to fulfill order" },
        { status: apiRes.status }
      );
    }

    const fulfillment = (await apiRes.json()) as FulfillOrderResponse;

    await resend.emails.send({
      from: `Support <${process.env.SENDER_EMAIL}>`,
      to: normalizedEmail,
      subject: "Order Confirmation",
      react: (
        <PurchaseReceiptEmail
          order={{
            id: fulfillment.orderId,
            priceInCents: fulfillment.priceInCents,
            createdAt: new Date(fulfillment.createdAt),
          }}
          product={{
            name: fulfillment.productName,
            imagePath: fulfillment.productImagePath ?? "",
            description: fulfillment.productDescription ?? "",
          }}
          downloadVerificationId={fulfillment.downloadVerificationId}
          serverUrl={
            process.env.NEXT_PUBLIC_SERVER_URL || "https://booky-mu.vercel.app/"
          }
        />
      ),
    });
  }

  return new NextResponse(null, { status: 200 });
}