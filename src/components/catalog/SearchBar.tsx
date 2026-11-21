"use client";

import React, { useState } from "react";
import type { Product } from "@/lib/products";

interface ProductsSearchProps {
  products: Product[];
  renderItem?: (product: Product) => React.ReactNode;
  heading?: string;
}

function defaultRenderItem(product: Product): React.ReactNode {
  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold">{product.name}</h3>
      <p className="text-sm text-muted-foreground">{product.author}</p>
    </div>
  );
}

export default function ProductsSearch({
  products,
  renderItem = defaultRenderItem,
  heading = "Search",
}: ProductsSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = safeProducts.filter((product) => {
    if (!product) return false;
    const name = product.name?.toLowerCase() ?? "";
    const author = product.author?.toLowerCase() ?? "";
    return name.includes(normalizedQuery) || author.includes(normalizedQuery);
  });

  const itemRenderer = typeof renderItem === "function" ? renderItem : defaultRenderItem;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">{heading}</h2>

        <input
          type="text"
          className="border rounded-md px-3 py-2 w-full max-w-md block mx-auto"
          placeholder="Search for a product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <React.Fragment key={product.id}>
              {itemRenderer(product)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}