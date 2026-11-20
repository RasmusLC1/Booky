import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/ui/ProductCard";
import { type Product, fetchMostPopular, fetchNewest } from "@/lib/products";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { cache } from "@/lib/cache"

const getMostPopularProducts = cache(
  fetchMostPopular,
  ["/", "getMostPopularProducts"],
  { revalidate: 60 * 60 * 2 }
)

const getNewestProducts = cache(
  fetchNewest,
  ["/", "getNewestProducts"],
  { revalidate: 60 * 60 * 2 }
)

export default function HomePage() {
  return (
    <main className="space-y-12">
      <ProductGridSection
        title="Most Popular"
        productsFetcher={getMostPopularProducts}
      />
      <ProductGridSection title="Newest" productsFetcher={getNewestProducts} />
    </main>
  );
}

type ProductGridSectionProps = {
  title: string;
  productsFetcher: () => Promise<Product[]>;
};

function ProductGridSection({
  title,
  productsFetcher,
}: ProductGridSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Button variant="outline" asChild>
          <Link href="/products" className="space-x-2">
            <span>View All</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4">
        {/* {While function is waiting to load it loads 3 product card skeletons as placeholders} */}
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          }
        >
          <ProductSuspense productsFetcher={productsFetcher} />
        </Suspense>
      </div>
    </div>
  );
}

async function ProductSuspense({
  productsFetcher,
}: {
  productsFetcher: () => Promise<Product[]>;
}) {
  {
    return (await productsFetcher()).map((product) => (
      <ProductCard key={product.id} {...product} />
    ));
  }
}
