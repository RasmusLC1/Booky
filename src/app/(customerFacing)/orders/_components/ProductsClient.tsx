"use client";

import React, { useState } from "react";
import ProductsSearch from "./SearchBar";
import Filter from "./Filter";
import { Button } from "@/components/ui/button";
import { emailOrderHistory } from "@/actions/orders";
import "./productClient.css";

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

interface ProductsClientProps {
  products: Product[];
  email: string;
  username: string;
}

export default function ProductsClient({
  products,
  email,
  username,
}: ProductsClientProps) {
  const handleEmailOrderHistory = async () => {
    try {
      await emailOrderHistory(email);
      alert("Order history sent via email!");
    } catch (error) {
      console.error("Failed to send order history:", error, email);
      alert("Failed to send order history. Please try again.");
    }
  };
  // 1) Convert string dates to Date objects up front
  const dateFixedProducts = products.map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));

  // 2) Track which filter is selected
  const [filterOption, setFilterOption] = useState("newest");

  // 3) Copy the array for sorting/filtering
  const filteredProducts = [...dateFixedProducts];

  // 4) Apply filter logic
  switch (filterOption) {
    case "newest":
      filteredProducts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      break;
    case "oldest":
      filteredProducts.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      break;
    case "az":
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "za":
      filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "lowest":
      filteredProducts.sort((a, b) => a.priceInCents - b.priceInCents);
      break;
    case "highest":
      filteredProducts.sort((a, b) => b.priceInCents - a.priceInCents);
      break;
    default:
      break;
  }

  return (
    <div>
      <div className="button-wrapper">
        <Button onClick={handleEmailOrderHistory}>
          Get Order History Via Email
        </Button>
      </div>
      {/* 5) Pass a callback to Filter so it can set the active filter */}
      <Filter onFilterSelect={setFilterOption} />
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">
          Welcome {username}
        </h1>
      </div>
      {/* 6) Render the (optionally) filtered products */}
      <ProductsSearch products={filteredProducts} />
    </div>
  );
}
