"use server";

import { z } from "zod";
import db from "@/db/db";
import bcrypt from "bcrypt";
import { SendAccountCreationEmail } from "./accontCreationEmail"

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

  // 3. Check if user already exists
  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });
  if (existingUser) {
    return {
      error: {
        email: existingUser.email === data.email ? "Email is already in use" : "",
        username: existingUser.username === data.username ? "Username is already in use" : "",
      },
    };
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // 5. Store user in database
  await db.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
    },
  });

  // 6. Send confirmation email
  const emailFormData = new FormData();
  emailFormData.append("email", data.email);
  await SendAccountCreationEmail(emailFormData);

  return { success: true };
}
