"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ui/ProductCard";

type Product = {
    id: string;
    name: string;
    description: string;
    priceInCents: number;
    imagePath: string;
    createdAt: Date;   
    updateAt: Date;    
  };

interface ProductsSearchProps {
  products: Product[];
}

export default function ProductsSearch({ products}: ProductsSearchProps) {
  const [query, setQuery] = useState("");

  // Filter the products by `query`.
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4"> 
      

      {/* Search Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Search</h2>

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
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
}
