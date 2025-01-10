"use server";

import { z } from "zod";
import db from "@/db/db";
import sanitizeHtml from "sanitize-html";

// 1. Validate the login form data
const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function Signin(formData: FormData) {
  // 1) Validate
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    // Return field errors if validation fails
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message;
    }
    return { error: fieldErrors };
  }

  // 2) Sanitize
  const data = {
    email: sanitizeHtml(result.data.email.toLowerCase()),
    password: sanitizeHtml(result.data.password),
  };

  // 3) Check if user exists
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  });
  if (!existingUser) {
    return {
      error: { email: "Email does not exist" },
    };
  }

  // 4) Check password
  const valid = await isValidPassword(existingUser.password, data.password);
  console.log(valid)
  if (!valid) {
    return {
      error: { password: "Password is not valid" },
    };
  }

  // 5) Login success
  return { success: true };
}

// Compare the hashed version of the candidate password with the stored hash
export async function isValidPassword(storedHash: string, candidate: string) {
  return (await hashPassword(candidate)) === storedHash;
}

// Hash the password (SHA-256, in hex)
async function hashPassword(password: string) {
  const arrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  return Buffer.from(arrayBuffer).toString("hex"); 
}
