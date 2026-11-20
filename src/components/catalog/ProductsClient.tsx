"use client";

import React, { useMemo, useState } from "react";
import ProductsSearch from "./SearchBar";
import Filter from "./Filter";
import { Button } from "@/components/ui/button";
import { emailOrderHistory } from "@/actions/orders";
import type { Product } from "@/lib/products";
import "./productClient.css";

interface ProductsClientProps {
  products: Product[];
  renderItem: (product: Product) => React.ReactNode;
  searchHeading?: string;
  email?: string;
  username?: string;
  showOrderHistoryButton?: boolean;
}

export default function ProductsClient({
  products,
  renderItem,
  searchHeading = "Search",
  email,
  username,
  showOrderHistoryButton = false,
}: ProductsClientProps) {
  const [filterOption, setFilterOption] = useState("newest");

  const handleEmailOrderHistory = async () => {
    if (!email) return;
    try {
      await emailOrderHistory(email);
      alert("Order history sent via email!");
    } catch (error) {
      console.error("Failed to send order history:", error, email);
      alert("Failed to send order history. Please try again.");
    }
  };

  const filteredProducts = useMemo(() => {
    const withTimestamps = products.map((p) => ({
      product: p,
      createdAtMs: new Date(p.createdAt).getTime(),
    }));

    switch (filterOption) {
      case "newest":
        return [...withTimestamps]
          .sort((a, b) => b.createdAtMs - a.createdAtMs)
          .map((item) => item.product);
      case "oldest":
        return [...withTimestamps]
          .sort((a, b) => a.createdAtMs - b.createdAtMs)
          .map((item) => item.product);
      case "az":
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return [...products].sort((a, b) => b.name.localeCompare(a.name));
      case "lowest":
        return [...products].sort((a, b) => a.priceInCents - b.priceInCents);
      case "highest":
        return [...products].sort((a, b) => b.priceInCents - a.priceInCents);
      default:
        return products;
    }
  }, [products, filterOption]);

  return (
    <div>
      {showOrderHistoryButton && email && (
        <div className="button-wrapper">
          <Button onClick={handleEmailOrderHistory}>
            Get Order History Via Email
          </Button>
        </div>
      )}

      <Filter onFilterSelect={setFilterOption} />

      {username && (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome {username}</h1>
        </div>
      )}

      <ProductsSearch
        products={filteredProducts}
        renderItem={renderItem}
        heading={searchHeading}
      />
    </div>
  );
}