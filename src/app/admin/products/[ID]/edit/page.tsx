import { notFound } from "next/navigation";
import { PageHeader } from "../../../_components/PageHeader";
import { ProductForm } from "../../_components/ProductForm";

export interface ProductDto {
  id: string;
  name: string;
  author: string;
  priceInCents: number;
  filePath: string;
  imagePath: string;
  description: string;
  category: string;
  length: number;
  isAvailableForPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

async function getProduct(id: string): Promise<ProductDto | null> {
  if (!id.trim()) return null;

  const res = await fetch(
    `${process.env.API_URL}/api/products/specific?id=${encodeURIComponent(id)}`,
    {
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status}`);
  }

  return (await res.json()) as ProductDto;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <PageHeader>Edit Product</PageHeader>
      <ProductForm product={product} />
    </>
  );
}