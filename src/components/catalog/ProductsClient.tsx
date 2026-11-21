"use client";

import React, { useMemo, useState } from "react";
import ProductsSearch from "./SearchBar";
import Filter from "./Filter";
import { Button } from "@/components/ui/button";
import { emailOrderHistory } from "@/actions/orders";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/products";
import "./productClient.css";

export type CatalogVariant = "catalog" | "orders";

interface ProductsClientProps {
  products: Product[];
  variant: CatalogVariant;
  searchHeading?: string;
  email?: string;
  username?: string;
  showOrderHistoryButton?: boolean;
}

function toTimestampMs(value: string | Date): number {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export default function ProductsClient({
  products,
  variant,
  searchHeading = "Search",
  email,
  username,
  showOrderHistoryButton = false,
}: ProductsClientProps) {
  const [filterOption, setFilterOption] = useState("newest");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleEmailOrderHistory = async () => {
    if (!email || isSendingEmail) return;
    setIsSendingEmail(true);
    try {
      await emailOrderHistory(email);
      alert("Order history sent via email!");
    } catch (error) {
      console.error("Failed to send order history:", error, email);
      alert("Failed to send order history. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];

    switch (filterOption) {
      case "newest":
        return [...safeProducts].sort(
          (a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
        );
      case "oldest":
        return [...safeProducts].sort(
          (a, b) => toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt)
        );
      case "az":
        return [...safeProducts].sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return [...safeProducts].sort((a, b) => b.name.localeCompare(a.name));
      case "lowest":
        return [...safeProducts].sort(
          (a, b) => a.priceInCents - b.priceInCents
        );
      case "highest":
        return [...safeProducts].sort(
          (a, b) => b.priceInCents - a.priceInCents
        );
      default:
        return safeProducts;
    }
  }, [products, filterOption]);

  return (
    <div className="products-container max-w-6xl mx-auto space-y-6">
      {showOrderHistoryButton && email && (
        <div className="button-wrapper">
          <Button onClick={handleEmailOrderHistory} disabled={isSendingEmail}>
            {isSendingEmail ? "Sending..." : "Get Order History Via Email"}
          </Button>
        </div>
      )}

      <Filter onFilterSelect={setFilterOption} />

      {username && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome {username}</h1>
        </div>
      )}

      <ProductsSearch
        products={filteredProducts}
        heading={searchHeading}
        renderItem={(product: Product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            author={product.author}
            priceInCents={product.priceInCents}
            description={product.description}
            imagePath={product.imagePath}
            downloadVerificationId={
              variant === "orders" ? product.downloadVerificationId : undefined
            }
          />
        )}
      />
    </div>
  );
}