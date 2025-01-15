import React, { Suspense, cache } from "react";
import { getServerSession, Session } from "next-auth";
import { redirect } from "next/navigation";
import db from "@/db/db";
import { Prisma } from "@prisma/client";
import { ProductCardSkeleton } from "@/components/ProductCard";
import ProductsClient from "./_components/ProductsClient";

// Type for User with Orders and Products
type UserWithOrders = Prisma.UserGetPayload<{
  include: {
    orders: {
      include: {
        product: true;
      };
    };
  };
}>;

export default async function MyOrdersPage() {
  // 1. Check the user session
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/login");
    return null;
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

const getOrders = cache(async (email: string): Promise<UserWithOrders["orders"]> => {
  try {
    // Fetch user and their orders from the database
    const user = await db.user.findUnique({
      where: { email },
      include: {
        orders: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!user || !user.orders) {
      return [];
    }

    // Add download verification for each order
    return await Promise.all(
      user.orders.map(async (order) => {
        const downloadVerification = await db.downloadVerification.create({
          data: {
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            productid: order.product.id,
          },
        });

        return {
          ...order,
          downloadVerificationId: downloadVerification.id,
        };
      })
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
});

async function ProductsSuspense({ session }: { session: Session }) {
  if (!session.user || !session.user.email) {
    return <p>No orders found.</p>;
  }

  const orders = await getOrders(session.user.email);

  if (orders.length === 0) {
    return <p>No orders found.</p>;
  }

  // Filter unique products from orders
  const products = Array.from(
    new Map(orders.map((order) => [order.product.id, order.product])).values()
  );

  return (
    <div suppressHydrationWarning>
      <ProductsClient products={products} email={session.user.email} />
    </div>
  );
}
