"use client"; 

import { formatCurrency } from "@/lib/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import Link from "next/link";
import Image from "next/image";
import CreateOrder from "../CreateOrder";
import { GetProductReviews } from "../getProductReviews";

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
    console.log("HANDLE CREATE");
    const response = await CreateOrder(id);

    if (response.error) {
      alert(`Error: ${response.error}`);
    } else {
      alert(response.message || "Order created successfully!");
    }
  }

  return (
    <Card className="flex overflow-hidden flex-col">
      <div className="relative w-full h-auto aspect-video">
        <Image src={imagePath} fill alt={name} />
      </div>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <GetProductReviews productid={id} />

        <CardDescription>{formatCurrency(priceInCents / 100)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-4">{description}</p>
      </CardContent>
      <CardFooter>
      <Button onClick={handleCreateOrder}>DEMO Add Order</Button>

        <Button asChild size="lg" className="w-full">
          <Link href={`/products/${id}/purchase`}>Purchase</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Acts as a loading screen that pulses grey while loading
export function ProductCardSkeleton() {
    return (
      <Card className="overflow-hidden flex flex-col animate-pulse">
        <div className="w-full aspect-video bg-gray-300" />
        <CardHeader>
          <CardTitle>
            <div className="w-3/4 h-6 rounded-full bg-gray-300" />
          </CardTitle>
          <CardDescription>
            <div className="w-1/2 h-4 rounded-full bg-gray-300" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="w-full h-4 rounded-full bg-gray-300" />
          <div className="w-full h-4 rounded-full bg-gray-300" />
          <div className="w-3/4 h-4 rounded-full bg-gray-300" />
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled size="lg"></Button>
        </CardFooter>
      </Card>
    )
  }