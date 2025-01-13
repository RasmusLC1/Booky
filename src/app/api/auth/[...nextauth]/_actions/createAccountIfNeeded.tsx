// createAccountIfNeeded.ts

"use server";

import db from "@/db/db";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";


function generateRandomPassword(length = 32): string {
    // Adjust the charset to your liking (symbols, etc.)
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";
  
    // Generate random bytes
    const bytes = randomBytes(length);
  
    // Map each random byte to a character from charset
    for (let i = 0; i < length; i++) {
      const randomIndex = bytes[i] % charset.length;
      password += charset.charAt(randomIndex);
    }
  
    return password;
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

  // Generate a random password
  const randomPassword = generateRandomPassword();
  console.log("RANDOM PASSWORD", randomPassword);

  // Hash the random password with a salt (cost factor)
  const saltRounds = 10; // Adjust this value based on your security and performance needs
  const randomHashedPassword = await bcrypt.hash(randomPassword, 12);

  // 3. If user does not exist, create a new record
  await db.user.create({
    data: {
      email: user.email,
      username: user.name ?? "", // or derive from the profile
      password: randomHashedPassword, // Save hashed password
    },
  });
}


