import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  if (typeof token !== "string" || !token) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/password-reset/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json().catch(() => ({ error: "Unexpected response" }));
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error validating reset token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}