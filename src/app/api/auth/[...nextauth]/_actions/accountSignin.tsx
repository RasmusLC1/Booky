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
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  });
  if (!existingUser) {
    return { error: { email: "Email does not exist" } };
  }

  // 4. Verify password
  const isValid = await bcrypt.compare(data.password, existingUser.password);
  if (!isValid) {
    return { error: { password: "Invalid password" } };
  }

  return { success: true };
}
