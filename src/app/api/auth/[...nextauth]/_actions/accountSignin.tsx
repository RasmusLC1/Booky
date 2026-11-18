"use server";

import { z } from "zod";
import db from "@/db/db";
import bcrypt from "bcrypt";

// Validation schema
const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginVerification(formData: FormData) {
  // 1. Validate input
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message;
    }
    return { error: fieldErrors };
  }

  // 2. Sanitize data
  const data = {
    email: result.data.email.toLowerCase(),
    password: result.data.password,
  };

  // 3. Check if user exists
  const res = await fetch(`${process.env.API_URL}/api/users/verify-login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Key": process.env.INTERNAL_API_KEY!,
  },
  body: JSON.stringify(data), // { email, password }
  });


  // 4. Verify password
  if (!res.ok) {
  const body = await res.json().catch(() => null);
  return body?.error && typeof body.error === "object"
    ? { error: body.error }                 // { email: "..." } or { password: "..." }
    : { error: { email: "Something went wrong" } };
  }

  return { success: true };
}
