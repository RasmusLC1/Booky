"use server"
import OrderHistoryEmail from "@/email/OrderHistory"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY as string)

const genericMessage = {
  message: "Check your email to view your order history and download your products.",
}

interface OrderHistoryProduct {
  id: string
  name: string
  imagePath: string
  description: string
}

interface RawOrderHistoryItem {
  id: string
  priceInCents: number
  createdAt: string
  product: OrderHistoryProduct
  downloadVerificationId: string
}

interface OrderHistoryResponse {
  email: string
  orders: RawOrderHistoryItem[]
}

export async function emailOrderHistory(
  userEmail: string
): Promise<{ message?: string; error?: string }> {
  const res = await fetch(`${process.env.API_URL}/api/downloads/order-history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
    },
    body: JSON.stringify({ email: userEmail }),
    cache: "no-store",
  })

  if (res.status === 404) return genericMessage // unknown user: same answer as before
  if (!res.ok) return { error: "There was an error sending your email. Please try again." }

  const user = (await res.json()) as OrderHistoryResponse
  const orders = user.orders.map((o) => ({
    ...o,
    createdAt: new Date(o.createdAt),
  }))

  const data = await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: user.email,
    subject: "Order History",
    react: (
      <OrderHistoryEmail
        orders={orders}
        serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "https://booky-mu.vercel.app/"}
      />
    ),
  })

  if (data.error) {
    return { error: "There was an error sending your email. Please try again." }
  }

  return genericMessage
}