"use client";

import { useState } from "react";
import { DownloadProduct } from "@/components/DownloadProductCard";

type Product = {
  id: string;
  name: string;
  author: string;
  description: string;
  priceInCents: number;
  imagePath: string;
  createdAt: Date;
  updatedAt: Date;
};

interface ProductsSearchProps {
  products: Product[];
}

export default function ProductsSearch({ products }: ProductsSearchProps) {
  const [query, setQuery] = useState("");

  // Filter the products by `query`.
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.author.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">
          Search through your orders
        </h2>

        {/* Search Input */}
        <input
          type="text"
          className="border p-2 w-full md:w-1/2 block mx-auto"
          placeholder="Search for a product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <DownloadProduct key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
}
