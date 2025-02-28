"use client";

import "./ReviewProduct.css";
import { useState, useEffect } from "react";

// Fetch review from the API endpoint
type Review = { rating: number };

async function fetchReview(productid: string): Promise<Review[]> {
  const response = await fetch(`/api/getProductReview/${productid}`);
  if (!response.ok) {
    return []; // Return an empty array if no reviews are found
  }
  return response.json(); // Expecting an array of { rating: number }
}

function getAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0; // Avoid division by zero
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round(total / reviews.length);
}



export function GetProductReviews({ productid }: { productid: string }) {
  const [existingReview, setExistingReview] = useState<number | null>(null);

  useEffect(() => {
    async function loadReviews() {
      const reviews = await fetchReview(productid);
      if (reviews.length > 0) {
        setExistingReview(getAverageRating(reviews));
      }
    }
    loadReviews();
  }, [productid]);

  return (
    <div className="rating">
      {[5, 4, 3, 2, 1].map((value) => (
        <label
          key={value}
          htmlFor={`star${value}`}
          className={existingReview !== null && existingReview >= value ? "selected" : ""}
        >
          <input
            type="radio"
            id={`star${value}`}
            name="rating"
            value={value}
            checked={existingReview !== null && existingReview >= value}
            disabled // Prevents interaction
          />
        </label>
      ))}
      
    </div>
  );
}
