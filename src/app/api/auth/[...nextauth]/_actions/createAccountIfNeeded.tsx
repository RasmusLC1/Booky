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

  // 1. Check if user already exists in DB by email
  const existingUser = await db.user.findUnique({
    where: { email: user.email },
  });

  // 2. If user already exists, do nothing
  if (existingUser) {
    return;
  }


  // Hash a random password with a salt factor
  const randomHashedPassword = await bcrypt.hash(generateRandomPassword(), 12);

  // 3. If user does not exist, create a new record
  await db.user.create({
    data: {
      email: user.email,
      username: user.name ?? "", // or derive from the profile
      password: randomHashedPassword, // Save hashed password
    },
  });
}


