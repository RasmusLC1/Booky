import "server-only"
import { Resend } from "resend"
import AccountCreationEmail from "@/email/AccountCreation"

const resend = new Resend(process.env.RESEND_API_KEY as string)

export async function sendAccountCreationEmail(email: string, username: string) {
  const data = await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: `Welcome to Booky! ${username}`,
    react: (
      <AccountCreationEmail
        user={{ email, username }}
        serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "https://booky-mu.vercel.app/"}
      />
    ),
  })

  if (data.error) console.error("Welcome email failed:", data.error)
}
