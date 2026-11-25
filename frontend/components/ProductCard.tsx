import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import "./productCard.css";

type ProductCardProps = {
  id: string;
  name: string;
  author?: string;
  description: string;
  priceInCents: number;
  imagePath: string;
  downloadVerificationId?: string;
};

export function ProductCard({
  id,
  name,
  author,
  description,
  priceInCents,
  imagePath,
  downloadVerificationId,
}: ProductCardProps) {
  return (
    <div className="card">
      <div className="card-image-container">
        <Image src={imagePath} fill alt={name} />
      </div>
      <div className="card-header">
        <h2 className="card-title">{name}</h2>
        {author && <p className="card-description">{author}</p>}
      </div>
      <div className="card-content">
        <p className="line-clamp-4">{description}</p>
      </div>
      <div className="card-footer">
        <Button asChild size="lg" className="button-full-width">
          {downloadVerificationId ? (
            <Link href={`/products/download/${downloadVerificationId}`}>
              Download
            </Link>
          ) : (
            <Link href={`/products/${id}/purchase`}>
              Buy{" "}
              {(priceInCents / 100).toLocaleString("da-DK", {
                style: "currency",
                currency: "DKK",
              })}
            </Link>
          )}
        </Button>
      </div>
    </div>
  );
}

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
        <Button className="button-full-width" disabled size="lg" />
      </div>
    </div>
  );
}
