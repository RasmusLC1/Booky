import React, { Suspense } from "react";
import { getServerSession, Session } from "next-auth";
import { redirect } from "next/navigation";
import { ProductCardSkeleton } from "@/components/ProductCard";
import ProductsClient from "@/components/catalog/ProductsClient";
import { fetchMyOrders, type Product } from "@/lib/products";

export default async function MyOrdersPage() {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="orders-page">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
          </div>
        }
      >
        <ProductsSuspense session={session} />
      </Suspense>
    </div>
  );
}

async function ProductsSuspense({ session }: { session: Session }) {
  if (!session.user || !session.user.email || !session.user.name) {
    return <p>No orders found.</p>;
  }

  let orders: Awaited<ReturnType<typeof fetchMyOrders>> = [];
  try {
    orders = await fetchMyOrders();
  } catch (error) {
    console.error("Error fetching orders:", error);
  }

  if (orders.length === 0) {
    return <p>No orders found.</p>;
  }

  const products: Product[] = Array.from(
    new Map(orders.map((order) => [order.product.id, order.product])).values()
  );

  return (
    <div suppressHydrationWarning className="space-y-4">
      <ProductsClient
        products={products}
        variant="orders"
        email={session.user.email}
        username={session.user.name}
        showOrderHistoryButton
        searchHeading="Search through your orders"
      />
    </div>
  );
}