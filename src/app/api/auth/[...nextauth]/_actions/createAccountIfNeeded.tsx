// createAccountIfNeeded.ts

"use server";

import db from "@/db/db";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";


function generateRandomPassword(): string {
    return randomBytes(32).toString("hex"); // 64-character hex string
  }
/**
 * Creates a new user record if one doesn't already exist for the given email.
 * Called from the NextAuth signIn callback.
 */
export async function createAccountIfNeeded(
  user: { id?: string; email?: string | null; name?: string | null },
  ) {
    // If there's no email, we can't create an account in your DB
    if (!user?.email) {
      console.warn("No email found for user:", user);
      return;
    }
    console.log("PRINTTESTTEST")
    await fetch(`${process.env.API_URL}/api/users/ensure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
    },
    body: JSON.stringify({ email: user.email, name: user.name }),
  });
}


