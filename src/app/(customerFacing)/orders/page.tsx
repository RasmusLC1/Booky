"use client";

import React from "react";
import ProductsSearch from "@/components/catalog/SearchBar";
import type { Product } from "@/lib/products";

interface ProductsClientProps {
  products: Product[];
  variant?: "catalog" | "orders";
  email?: string;
  username?: string;
  showOrderHistoryButton?: boolean;
  searchHeading?: string;
}

export default function ProductsClient({
  products,
  variant = "catalog",
  email,
  username,
  showOrderHistoryButton = false,
  searchHeading = "Search",
}: ProductsClientProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* If you had a filter sidebar/bar or order history button, render it here */}
      {showOrderHistoryButton && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {username ? `Orders for ${username}` : email}
          </span>
          {/* Order history toggle/modal button here */}
        </div>
      )}

      <ProductsSearch
        products={products}
        heading={searchHeading}
        renderItem={(product: Product) => (
          <div className="border rounded-lg p-4 space-y-2 bg-white shadow-sm">
            {product.imagePath && (
              <img
                src={product.imagePath}
                alt={product.name}
                className="w-full h-44 object-cover rounded"
              />
            )}
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.author}</p>
            <p className="text-sm font-medium">
              ${(product.priceInCents / 100).toFixed(2)}
            </p>
          </div>
        )}
      />
    </div>
  );
}