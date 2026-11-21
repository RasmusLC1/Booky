"use server";

import { z } from "zod";
import { sendAccountCreationEmail } from "./accontCreationEmail"

// Validation schema
const addSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function addUser(formData: FormData) {
  // 1. Validate input
  const result = addSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
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
    username: result.data.username.toLowerCase(),
    password: result.data.password,
  };

  // 3. Create the user in the .NET API
  const res = await fetch(`${process.env.API_URL}/api/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_API_KEY!.trim(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return body?.error && typeof body.error === "object"
      ? { error: body.error as Record<string, string> }
      : { error: { email: "Something went wrong. Please try again." } };
  }
  // 4. Send confirmation email
  await sendAccountCreationEmail(data.email, data.username);

  return { success: true };
}