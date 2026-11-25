"use server";

import Reset_Password from "../../../../../email/ResetPassword";
import { Resend } from "resend";
import { z } from "zod";

const emailSchema = z.string().email();
const resend = new Resend(process.env.RESEND_API_KEY);

interface ResetTokenResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export async function sendPasswordResetEmail(
  email: string
): Promise<{ message?: string; error?: string }> {
  const parsed = emailSchema.safeParse(email.trim());
  if (!parsed.success) {
    return { error: "Invalid email address" };
  }

  const apiUrl = process.env.API_URL;
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!apiUrl || !internalKey) {
    console.error("Missing API_URL or INTERNAL_API_KEY environment variable");
    return { error: "There was an error sending your email. Please try again." };
  }

  let data: ResetTokenResponse;
  try {
    const res = await fetch(`${apiUrl}/api/password-reset/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalKey,
      },
      body: JSON.stringify({ email: parsed.data }),
      cache: "no-store",
    });

    if (res.status === 404) {
      return { error: "No account found with this email" };
    }

    if (!res.ok) {
      return { error: "There was an error sending your email. Please try again." };
    }

    data = (await res.json()) as ResetTokenResponse;
  } catch (error) {
    console.error("Failed to create password reset token:", error);
    return { error: "There was an error sending your email. Please try again." };
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/passwordreset?token=${encodeURIComponent(data.token)}`;

  const sendResult = await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: data.user.email,
    subject: "Reset your password",
    react: <Reset_Password user={data.user} resetUrl={resetUrl} />,
  });

  if (sendResult.error) {
    return { error: "There was an error sending your email. Please try again." };
  }

  return { message: "Password reset email has been sent." };
}