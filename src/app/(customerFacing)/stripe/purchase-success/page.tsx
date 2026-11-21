import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const apiHeaders = (extra?: Record<string, string>) => ({
  "Content-Type": "application/json",
  "X-Internal-Key": process.env.INTERNAL_API_KEY!,
  ...extra,
});

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent: string }>;
}) {
  const { payment_intent } = await searchParams;
  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
  const productId = paymentIntent.metadata.productid;
  if (!productId) return notFound();

  const productRes = await fetch(
    `${process.env.API_URL}/api/products/specific?id=${encodeURIComponent(productId)}`,
    { headers: apiHeaders(), cache: "no-store" }
  );
  if (!productRes.ok) return notFound();
  const product = await productRes.json();

  const isSuccess = paymentIntent.status === "succeeded";
  const email = paymentIntent.metadata.email ?? paymentIntent.receipt_email ?? "";

  let verificationId: string | null = null;
  if (isSuccess && email) {
    const verRes = await fetch(`${process.env.API_URL}/api/downloads/verification`, {
      method: "POST",
      headers: apiHeaders({ "X-User-Email": email }),
      body: JSON.stringify({ productId }),
      cache: "no-store",
    });
    if (verRes.ok) verificationId = (await verRes.json()).id;
  }

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <h1 className="text-4xl font-bold">{isSuccess ? "Success!" : "Something went wrong"}</h1>
      <div className="flex gap-4 items-center">
        <div className="aspect-video flex-shrink-0 w-1/3 relative">
          <Image src={product.imagePath} fill alt={product.name} className="object-cover" />
        </div>
        <div>
          <div className="text-lg">{formatCurrency(product.priceInCents / 100)}</div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="line-clamp-3 text-muted-foreground">{product.description}</div>
          <Button className="mt-4" size="lg" asChild>
            {isSuccess && verificationId ? (
              <a href={`/products/download/${verificationId}`}>Download</a>
            ) : (
              <Link href={`/products/${product.id}/purchase`}>Try Again</Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}