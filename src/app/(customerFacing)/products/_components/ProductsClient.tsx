"use client";

import React, { useState } from "react";
import ProductsSearch from "./SearchBar";
import Filter from "./Filter";


type Product = {
    id: string;
    name: string;
    description: string;
    priceInCents: number;
    imagePath: string;
    createdAt: Date;   
    updatedAt: Date;    
  };

interface ProductsClientProps {
  products: Product[];
}

export default function ProductsClient({ products }: ProductsClientProps) {
  // 1) Convert string dates to Date objects up front
  const dateFixedProducts = products.map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));

  // 2) Track which filter is selected
  const [filterOption, setFilterOption] = useState("newest");

  // 3) Copy the array for sorting/filtering
  let filteredProducts = [...dateFixedProducts];

  // 4) Apply filter logic
  switch (filterOption) {
    case "newest":
      filteredProducts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      break;
    case "oldest":
      filteredProducts.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
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
      {/* 5) Pass a callback to Filter so it can set the active filter */}
      <Filter onFilterSelect={setFilterOption} />

      {/* 6) Render the (optionally) filtered products */}
      <ProductsSearch products={filteredProducts} />
    </div>
  );
}
