"use client";

import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import "./productCard.css";

type ProductCardProps = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imagePath: string;
};

export function DownloadProduct({
  id,
  name,
  description,
  imagePath,
}: ProductCardProps) {
  return (
    <div className="card">
      <div className="card-image-container">
        <Image src={imagePath} fill alt={name} />
      </div>
      <div className="card-header">
        <h2 className="card-title">{name}</h2>
      </div>
      <div className="card-content">
        <p className="line-clamp-4">{description}</p>
      </div>
      <div className="card-footer">
        <Link href={`/orders/${id}/download`}>
          <Button size="lg" className="button-full-width">
            Download
          </Button>
        </Link>
      </div>
    </div>
  );
}
