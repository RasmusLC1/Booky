"use client";

import "./ReviewProduct.css";
import { useState, useEffect, useTransition } from "react";
import { submitReview } from "@/app/actions/submitReview";

// Fetch review from the API endpoint
async function fetchReview(productid: string, userid: string) {
  const response = await fetch(`/api/getuserreview/${productid}?userid=${userid}`); // Pass userid in the query string
  if (!response.ok) {
    return null; // No review found
  }
  return response.json();
}

export function ReviewProduct({ productid }: { productid: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Assume you have a way to get the current logged-in user's ID
  const userid = "current_user_id"; // Replace with actual method to get the logged-in user ID

  // Fetch the existing review when the component mounts
  useEffect(() => {
    async function loadReview() {
      const review = await fetchReview(productid, userid); // Pass userid here
      if (review) {
        setRating(review.rating); // Set the initial rating to the fetched review rating
      }
    }
    loadReview();
  }, [productid, userid]); // Add userid as a dependency to re-fetch if it changes

  const handleRating = (value: number) => {
    setRating(value);
  
    startTransition(async () => {
      const formData = new FormData();
      formData.append("productid", productid);
      formData.append("rating", value.toString());
      formData.append("userid", userid);
  
      await submitReview(formData);
  
    });
  };
  

  return (
    <div className="rating">
      {[5, 4, 3, 2, 1].map((value) => (
        <label
          key={value}
          htmlFor={`star${value}`}
          className={rating !== null && rating >= value ? "selected" : ""}
        >
          <input
            type="radio"
            id={`star${value}`}
            name="rating"
            value={value}
            checked={rating === value}
            onChange={() => handleRating(value)}
            disabled={isPending} // Disable while submitting
          />
        </label>
      ))}
    </div>
  );
}
