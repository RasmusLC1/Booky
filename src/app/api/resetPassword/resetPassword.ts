import { db } from "@/db";

export default async function handler(req, res) {
  const { token } = req.query;

  // Find the token in the database
  const resetRecord = await db.passwordReset.findUnique({
    where: { token },
  });

  // Check if token exists and has not expired
  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  // If valid, proceed with password reset
  res.status(200).json({ message: "Token is valid" });
}
