"use client";
import { useState, useEffect, useTransition } from "react";
import { submitReview } from "@/app/actions/submitReview";
import "./ReviewProduct.css";

export function ReviewProduct({ productid }: { productid: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const userid = "current_user_id"; // Replace with actual user ID

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadReview() {
      try {
        const response = await fetch(`/api/getuserreview/${productid}?userid=${userid}`, {
          signal: controller.signal
        });
        if (isMounted && response.ok) {
          const review = await response.json();
          setRating(review?.rating || null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Fetch error:", error);
        }
      }
    }

    setRating(null);
    loadReview();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [productid, userid]);

  const handleRating = (value: number) => {
    if (isPending) return;
  
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("productid", productid);
        formData.append("rating", value.toString());
        formData.append("userid", userid);
        
        await submitReview(formData);
        setRating(value);
      } catch (error) {
        console.error("Submission error:", error);
      }
    });
  };
  
  // Update the JSX to use proper ordering without CSS transforms
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].reverse().map((value) => (
        <button
        key={value}
        type="button"
        className={`star ${((hoverRating ?? 0) || (rating ?? 0)) >= value ? "active" : ""}`}
        onMouseEnter={() => setHoverRating(value)}
        onMouseLeave={() => setHoverRating(null)}
        onClick={() => handleRating(value)}
        disabled={isPending}
        aria-label={`Rate ${value} stars`}
      >
        ★
      </button>
      
      ))}
    </div>
  );
}