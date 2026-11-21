"use server";

import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFieldErrors = Partial<Record<"email" | "password", string>>;

export async function loginVerification(
  formData: FormData
): Promise<{ success: true } | { error: LoginFieldErrors }> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    const fieldErrors: LoginFieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
        fieldErrors[key] ??= issue.message;
      }
    }
    return { error: fieldErrors };
  }

  const payload = {
    email: result.data.email.toLowerCase(),
    password: result.data.password,
  };

  const res = await fetch(`${process.env.API_URL}/api/users/verify-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      "X-User-Email": payload.email,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (body?.error && typeof body.error === "object") {
      return { error: body.error as LoginFieldErrors };
    }
    return { error: { email: "Invalid email or password" } };
  }

  return { success: true };
}