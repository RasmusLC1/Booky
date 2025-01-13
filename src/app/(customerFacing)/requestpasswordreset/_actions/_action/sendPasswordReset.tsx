"use server";

import db from "@/db/db";
import Reset_Password from "@/email/ResetPassword";
import { Resend } from "resend";
import { z } from "zod";
import { randomBytes } from "crypto";

const emailSchema = z.string().email();
const resend = new Resend(process.env.RESEND_API_KEY as string);

function generateResetToken() {
  return randomBytes(32).toString("hex"); // 64-character hex string
}

export async function sendPasswordResetEmail(
  email: string
): Promise<{ message?: string; error?: string }> {
  // Validate the email address
  const result = emailSchema.safeParse(email);

  if (!result.success) {
    return { error: "Invalid email address" };
  }

  // Find the user by email
  const user = await db.user.findUnique({
    where: { email: result.data },
    select: {
      id: true,        // ✅ Make sure to include the ID
      email: true,
      username: true,
    },
  });

  if (!user) {
    return { error: "No account found with this email" };
  }

  // Generate a random token
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiration

  // Store the reset token in the database
  await db.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });
  
  // Generate the reset URL
  const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/passwordreset?token=${token}`;
  // Send the email using Resend
  const data = await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: user.email,
    subject: "Reset your password",
    react: <Reset_Password user={user} resetUrl={resetUrl} />,
  });
  if (data.error) {
    return { error: "There was an error sending your email. Please try again." };
  }

  return { message: "Password reset email has been sent." };
}
