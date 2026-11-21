"use server";

import bcrypt from "bcrypt";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function sendPasswordReset(formData: FormData): Promise<{
  message?: string;
  error?: Record<string, string>;
}> {
  const result = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "password");
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { error: fieldErrors };
  }

  const { token, password } = result.data;

  const apiUrl = process.env.API_URL;
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!apiUrl || !apiKey) {
    return { error: { password: "Server configuration error" } };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const res = await fetch(`${apiUrl}/api/users/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": apiKey,
      },
      body: JSON.stringify({
        token,
        newPassword: hashedPassword,
      }),
      cache: "no-store",
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      if (body?.error && typeof body.error === "object") {
        return { error: body.error as Record<string, string> };
      }
      return { error: { token: "Invalid or expired token" } };
    }

    return {
      message: body?.message ?? "Your password has been reset successfully!",
    };
  } catch (err) {
    console.error("Error calling reset-password endpoint:", err);
    return { error: { password: "Something went wrong. Please try again." } };
  }
}