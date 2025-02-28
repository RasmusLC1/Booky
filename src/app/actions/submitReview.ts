"use server";

import { z } from "zod";
import db from "@/db/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

// Validation schema
const reviewSchema = z.object({
  productid: z.string().min(1, "Product ID is required"),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
});

export async function submitReview(formData: FormData) {
  // 1. Validate input
  const result = reviewSchema.safeParse({
    productid: formData.get("productid"),
    rating: Number(formData.get("rating")), // Convert from FormData
  });

  if (!result.success) {
    return { error: result.error.format() };
  }

  // 2. Ensure user is logged in
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/login");
  }

  // 3. Retrieve user ID from the database using the email
  const userEmail = session.user?.email;

  if (!userEmail) {
    return { error: { user: "User email is missing" } };
  }

  const user = await db.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return { error: { user: "User not found" } };
  }

  // 4. Check if a review already exists for this user and product
  const existingReview = await db.review.findFirst({
    where: {
      productid: result.data.productid,
      userid: user.id,
    },
  });

  // 5. If a review exists, update it, otherwise create a new one
  try {
    if (existingReview) {
      // Update the existing review
      console.log("UPDATE")
      await db.review.update({
        where: { id: existingReview.id },
        data: {
          rating: result.data.rating,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create a new review
      await db.review.create({
        data: {
          productid: result.data.productid,
          userid: user.id,
          rating: result.data.rating,
        },
      });
    }

    return { success: true };
  } catch (error) {
    // Ensure error is a valid object before logging
    if (error && error instanceof Error) {
      console.error("Database error:", error.message);
    } else {
      console.error("Unknown error:", error);
    }

    return { error: { db: "Failed to save review" } };
  }
}
