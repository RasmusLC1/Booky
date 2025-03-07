"use client";

import { formatCurrency } from "@/lib/formatters";
import { Button } from "./button";
import Link from "next/link";
import Image from "next/image";
import CreateOrder from "../CreateOrder";
import { GetProductReviews } from "../getProductReviews";
import "../productCard.css";

type ProductCardProps = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imagePath: string;
};

// Actual card layout for products
export function ProductCard({
  id,
  name,
  description,
  priceInCents,
  imagePath,
}: ProductCardProps) {
  async function handleCreateOrder() {
    const response = await CreateOrder(id);
    alert(
      response.error
        ? `Error: ${response.error}`
        : response.message || "Order created successfully!"
    );
  }

  return (
    <div className="card">
      <div className="card-image-container">
        <Image src={imagePath} fill alt={name} className="book-cover" />
      </div>
      <div className="card-header">
        <h2 className="card-title">{name}</h2>
        <GetProductReviews productid={id} />
        <p className="card-description">{formatCurrency(priceInCents / 100)}</p>
      </div>
      <div className="card-content">
        <p className="line-clamp-4">{description}</p>
      </div>
      <div className="card-footer">
        <div className="card-footer buttons-row">
          <Button onClick={handleCreateOrder}>DEMO Add Order</Button>
          <Button asChild size="lg" className="button-full-width">
            <Link href={`/products/${id}/purchase`}>Purchase</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for loading state
export function ProductCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="card-image-container skeleton-line" />
      <div className="skeleton-card-header">
        <div className="skeleton-card-title" />
        <div className="skeleton-card-description" />
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-line-short" />
      </div>
      <div className="card-footer">
        <Button className="button-full-width" disabled size="lg"></Button>
      </div>
    </div>
  );
}
