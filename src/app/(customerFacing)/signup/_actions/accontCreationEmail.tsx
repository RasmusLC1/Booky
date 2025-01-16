"use server"
import db from "@/db/db"
import AccountCreationEmail from "@/email/AccountCreation"
import { Resend } from "resend"
import { z } from "zod"

const emailSchema = z.string().email()
const resend = new Resend(process.env.RESEND_API_KEY as string)

export async function SendAccountCreationEmail(
  formData: FormData
): Promise<{ message?: string; error?: string }> {
  const result = emailSchema.safeParse(formData.get("email"))

  if (result.success === false) {
    return { error: "Invalid email address" }
  }

  const user = await db.user.findUnique({
    where: { email: result.data },
    select: {
      email: true,
      username: true,
    }
  })

  if (user == null) {
    return {
      message:
        "User not Found",
    }
  }


  const data = await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: user.email,
    subject: `Welcome to Booky! ${user.username}`,
    react: <AccountCreationEmail user={user} serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "https://booky-mu.vercel.app/"} />,
  })

  if (data.error) {
    return { error: "There was an error sending your email. Please try again." }
  }

  return {
    message:
      "Account creation email has been sent",
  }
}
