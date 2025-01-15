import {  ProductCardSkeleton } from "@/components/ui/ProductCard";
import db from "@/db/db";
import { Suspense } from "react";
import {cache} from "@/lib/cache"
import ProductsClient from "./_components/ProductsClient";


export default function ProductsPage() {
  return (
    <div suppressHydrationWarning>
      {/* {While function is waiting to load it loads 6 product card skeletons as placeholders} */}
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
        <ProductsSuspense/>
      </Suspense>
    </div>
  );
}

const getProducts = cache(() => {
  return db.product.findMany({
    where: { isAvailabelForPurchase: true },
    orderBy: { name: "asc" },
  });
}, ["/products", "getProducts"], {revalidate: 60 * 60 * 6})


async function ProductsSuspense() {
  const products = await getProducts();
  return (
    <div>
      <ProductsClient products={products}/>
    </div>
  );
}
