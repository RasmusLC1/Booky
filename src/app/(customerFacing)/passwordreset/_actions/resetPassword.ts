"use server";

import db from "@/db/db";
import bcrypt from "bcrypt";
import { z } from "zod";

// Validation schema for token and password
const resetPasswordSchema = z.object({
  token: z.string().nonempty("Token is required"),
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
    result.error.issues.forEach((issue) => {
      fieldErrors[issue.path[0]] = issue.message;
    });
    return { error: fieldErrors };
  }

  const { token, password } = result.data;

  // Find the reset token in the database
  const resetRecord = await db.passwordReset.findFirst({
    where: { token },
  });

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    return { error: { token: "Invalid or expired token" } };
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user's password
  await db.user.update({
    where: { id: resetRecord.userId },
    data: { password: hashedPassword },
  });

  // Delete the token from the database
  await db.passwordReset.delete({
    where: { id: resetRecord.id },
  });

  return { message: "Your password has been reset successfully!" };
}
