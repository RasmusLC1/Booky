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
  }

  return (
    <div>
      <Suspense
        fallback={
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        }
      >
        <ProductsSuspense session={session} />
      </Suspense>
    </div>
  );
}

const getOrders = cache(
  async (email: string): Promise<UserWithOrders["orders"]> => {
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

    if (!user) {
      return [];
    }

    const orders = await Promise.all(
      user.orders.map(async (order) => {
        const downloadVerification = await db.downloadVerification.create({
          data: {
            expiresAt: new Date(Date.now() + 24 * 1000 * 60 * 60),
            productid: order.product.id,
          },
        });

        return {
          ...order,
          downloadVerificationId: downloadVerification.id,
        };
      })
    );

    return orders;
  }
);

async function ProductsSuspense({ session }: { session: Session }) {

  if (!session.user || !session.user.email) {
    return <p>No orders found.</p>;
  }


  const orders = await getOrders(session.user.email);

  const products = Array.from(
    new Map(orders.map((order) => [order.product.id, order.product])).values()
  );

  return (
    <div suppressHydrationWarning>
      <ProductsClient products={products} email={session.user.email} />
    </div>
  );
}
