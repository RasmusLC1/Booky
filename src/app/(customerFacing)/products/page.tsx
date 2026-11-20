import { ProductCard, ProductCardSkeleton } from "@/components/ui/ProductCard";
import { Suspense } from "react";
import { cache } from "@/lib/cache";
import { fetchAllProducts } from "@/lib/products";
import ProductsClient from "@/components/catalog/ProductsClient";

export default function ProductsPage() {
  return (
    <div suppressHydrationWarning>
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
        <ProductsSuspense />
      </Suspense>
    </div>
  );
}

const getProducts = cache(
  () => fetchAllProducts(),
  ["/products", "getProducts"],
  { revalidate: 60 * 60 * 2 }
);

async function ProductsSuspense() {
  const products = await getProducts();
  return (
    <div>
      <ProductsClient
        products={products}
        searchHeading="Search"
        renderItem={(product) => <ProductCard {...product} />}
      />
    </div>
  );
}