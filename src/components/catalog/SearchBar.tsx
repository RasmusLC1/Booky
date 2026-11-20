"use client";

import React, { useState } from "react";
import type { Product } from "@/lib/products";

interface ProductsSearchProps {
  products: Product[];
  renderItem: (product: Product) => React.ReactNode;
  heading?: string;
}

export default function ProductsSearch({
  products,
  renderItem,
  heading = "Search",
}: ProductsSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.author.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">{heading}</h2>

        <input
          type="text"
          className="border p-2 w-full md:w-1/2 block mx-auto"
          placeholder="Search for a product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <React.Fragment key={product.id}>
              {renderItem(product)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}