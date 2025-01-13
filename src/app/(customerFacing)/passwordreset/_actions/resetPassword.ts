"use server";

import db from "@/db/db";
import bcrypt from "bcrypt";
import { z } from "zod";

// Validation schema
const resetPasswordSchema = z.object({
  token: z.string().nonempty("Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function sendPasswordReset(formData: FormData): Promise<{ message?: string; error?: Record<string, string> }> {
  // 1. Validate input
  const result = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  
  if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
          fieldErrors[issue.path[0]] = issue.message;
        }
        return { error: fieldErrors };
    }
    
    const { token, password } = result.data;
    
    // 2. Find the reset token in the database
    const resetRecord = await db.passwordReset.findFirst ({
        where: { token },
    });
    
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
        return { error: { token: "Invalid or expired token" } };
    }

  // 3. Hash the new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Update the user's password in the database
  await db.user.update({
    where: { id: resetRecord.userId },
    data: { password: hashedPassword },
  });
  // 5. Delete the reset token from the database
  await db.passwordReset.delete({
    where: { id: resetRecord.id },
  });

  return { message: "Your password has been reset successfully!" };
}
