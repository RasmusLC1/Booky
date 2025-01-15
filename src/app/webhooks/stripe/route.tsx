import db from "@/db/db"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"
import PurchaseReceiptEmail from "@/email/PurchaseReceipt"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const resend = new Resend(process.env.RESEND_API_KEY as string)

export async function POST(req: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  )

  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge
    const productid = charge.metadata.productid
    const email = charge.billing_details.email
    const priceInCents = charge.amount
    const product = await db.product.findUnique({ where: { id: productid } })
    if (product == null || email == null) {
      return new NextResponse("Bad Request", { status: 400 })
    }

    // 1. Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    })
    // 2. If user does NOT exist, return error
    if (!user) {
      console.log("USER DOES NOT EXISTS")
      return NextResponse.json(
        { message: "User does not exist. Please create an account." },
        { status: 404 }
      )
    }

    // 3. If the user exists, handle the order
    const userFields = {
      email,
      orders: { create: { productid, priceInCents } },
    }
    const {
      orders: [order],
    } = await db.user.update({
      where: { email },
      data: userFields,
      select: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    })
    // Create a download link
    const downloadVerification = await db.downloadVerification.create({
      data: {
        productid,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    })

    // Send an email to the existing user
    await resend.emails.send({
      from: `Support <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Order Confirmation",
      react: (
        <PurchaseReceiptEmail
          order={order}
          product={product}
          downloadVerificationId={downloadVerification.id}
          serverUrl = {process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}
        />
      ),
    })
  }
  return new NextResponse()
}