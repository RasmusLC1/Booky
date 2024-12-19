// Is called by stripe when thre is a successful payment, comes directly from stripe
// So it is more secure https://dashboard.stripe.com/webhooks

import db from "@/db/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  if (event.type === "charge.succeeded") {
    const charge = event.data.object;
    // charge comes from stripe when signing the order form
    const productid = charge.metadata.productid;
    const email = charge.billing_details.email;
    const pricePaidInCents = charge.amount;

    const product = await db.product.findUnique({ where: { id: productid } });
    if (product == null || email == null) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Creates a new user with email and give them an order
    const userFields = {
        email,
        orders: {
          create: {
            productid,
            priceInCents: pricePaidInCents, // Make sure this matches your variable names
          },
        },
      };
    // If user already exists it just adds the order to them and sets their email again
    const {
      orders: [order],
    } = await db.user.upsert({
      where: { email },
      create: userFields,
      update: userFields,
      select: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    });


    const downloadVerification = await db.downloadVerification.create({
        data: {
            productid,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
        }
    })
  }
}
